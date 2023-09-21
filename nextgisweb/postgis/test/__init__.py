from contextlib import contextmanager
from secrets import token_hex
from uuid import uuid4

import geoalchemy2 as ga
import pytest
import sqlalchemy as sa
import transaction
from osgeo import ogr
from sqlalchemy.engine.url import URL as EngineURL
from sqlalchemy.engine.url import make_url as make_engine_url

from nextgisweb.env import DBSession, env
from nextgisweb.lib.ogrhelper import FIELD_GETTER

from nextgisweb.auth import User
from nextgisweb.feature_layer import GEOM_TYPE, GEOM_TYPE_OGR_2_GEOM_TYPE
from nextgisweb.spatial_ref_sys import SRS
from nextgisweb.vector_layer.util import (
    FIELD_TYPE_2_DB,
    FIELD_TYPE_2_ENUM,
    GEOM_TYPE_2_DB,
)

from .. import PostgisConnection, PostgisLayer


@contextmanager
def create_feature_layer(ogrlayer, parent_id, **kwargs):
    opts_db = env.core.options.with_prefix("test.database")

    for o in ("host", "name", "user"):
        if o not in opts_db:
            pytest.skip(f"Option test.database.{o} isn't set")

    con_args = dict(
        host=opts_db["host"],
        port=opts_db["port"],
        database=opts_db["name"],
        username=opts_db["user"],
        password=opts_db["password"],
    )

    engine_url = make_engine_url(EngineURL.create("postgresql+psycopg2", **con_args))

    engine = sa.create_engine(engine_url)
    meta = sa.MetaData()

    column_id = "id"
    columns = [sa.Column(column_id, sa.Integer, primary_key=True)]

    column_geom = "the_geom"
    geom_type = GEOM_TYPE_OGR_2_GEOM_TYPE[ogrlayer.GetGeomType()]
    dimension = 3 if geom_type in GEOM_TYPE.has_z else 2
    geometry_type_db = GEOM_TYPE_2_DB[geom_type]
    osr_ = ogrlayer.GetSpatialRef()
    assert osr_.GetAuthorityName(None) == "EPSG"
    srid = int(osr_.GetAuthorityCode(None))
    columns.append(
        sa.Column(
            column_geom,
            ga.Geometry(dimension=dimension, srid=srid, geometry_type=geometry_type_db),
        )
    )

    # Make columns different from keynames

    def column_keyname(name):
        return name[4:]

    def keyname_column(keyname):
        return "fld_%s" % keyname

    defn = ogrlayer.GetLayerDefn()
    for i in range(defn.GetFieldCount()):
        fld_defn = defn.GetFieldDefn(i)
        fld_name = fld_defn.GetNameRef()
        fld_type = FIELD_TYPE_2_ENUM[fld_defn.GetType()]
        columns.append(sa.Column(keyname_column(fld_name), FIELD_TYPE_2_DB[fld_type]))

    table = sa.Table("test_" + uuid4().hex, meta, *columns)

    meta.create_all(engine)

    with engine.connect() as conn:
        with conn.begin():
            for i, feature in enumerate(ogrlayer, start=1):
                values = dict(id=i)

                geom = feature.GetGeometryRef()
                geom_bytes = bytearray(geom.ExportToWkb(ogr.wkbNDR))
                values[column_geom] = ga.elements.WKBElement(geom_bytes, srid=srid)

                for k in range(feature.GetFieldCount()):
                    if not feature.IsFieldSet(k) or feature.IsFieldNull(k):
                        continue
                    fld_defn = defn.GetFieldDefn(k)
                    fld_name = fld_defn.GetNameRef()
                    fld_get = FIELD_GETTER[fld_defn.GetType()]
                    values[keyname_column(fld_name)] = fld_get(feature, k)

                conn.execute(table.insert().values(**values))

    with transaction.manager:
        res_common = dict(parent_id=parent_id, owner_user=User.by_keyname("administrator"))

        connection = PostgisConnection(
            **res_common,
            display_name=token_hex(),
            hostname=opts_db["host"],
            port=opts_db["port"],
            database=opts_db["name"],
            username=opts_db["user"],
            password=opts_db["password"],
        ).persist()

        layer = PostgisLayer(
            **res_common,
            display_name=token_hex(),
            connection=connection,
            srs=SRS.filter_by(id=srid).one(),
            table=table.name,
            schema="public",
            column_id=column_id,
            column_geom=column_geom,
            geometry_type=geom_type,
            geometry_srid=srid,
        ).persist()

        DBSession.flush()

        layer.setup()

        for field in layer.fields:
            field.keyname = field.display_name = column_keyname(field.column_name)

    try:
        yield layer
    finally:
        meta.drop_all(engine)
        engine.dispose()
