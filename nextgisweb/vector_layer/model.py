import re
import uuid

import geoalchemy2 as ga
from osgeo import gdal, ogr
from shapely.geometry import box
from sqlalchemy import event, func, inspect, sql
from zope.interface import implementer

from nextgisweb.env import COMP_ID, Base, DBSession, _, env
from nextgisweb.lib import db

from nextgisweb.core.exception import ValidationError as VE
from nextgisweb.feature_layer import (
    FIELD_TYPE,
    GEOM_TYPE,
    IFeatureLayer,
    IFieldEditableFeatureLayer,
    IGeometryEditableFeatureLayer,
    IWritableFeatureLayer,
    LayerField,
    LayerFieldsMixin,
    on_data_change,
    query_feature_or_not_found,
)
from nextgisweb.layer import IBboxLayer, SpatialLayerMixin
from nextgisweb.resource import DataScope, DataStructureScope, Resource, ResourceGroup, Serializer
from nextgisweb.resource import SerializedProperty as SP
from nextgisweb.resource import SerializedRelationship as SR
from nextgisweb.spatial_ref_sys import SRS

from .feature_query import FeatureQueryBase, calculate_extent
from .kind_of_data import VectorLayerData
from .table_info import TableInfo
from .util import (
    DRIVERS,
    ERROR_FIX,
    FID_SOURCE,
    FIELD_TYPE_2_DB,
    FIELD_TYPE_SIZE,
    SCHEMA,
    TOGGLE,
    read_dataset_vector,
)

Base.depends_on("resource", "feature_layer")

GEOM_TYPE_DISPLAY = (
    _("Point"),
    _("Line"),
    _("Polygon"),
    _("Multipoint"),
    _("Multiline"),
    _("Multipolygon"),
    _("Point Z"),
    _("Line Z"),
    _("Polygon Z"),
    _("Multipoint Z"),
    _("Multiline Z"),
    _("Multipolygon Z"),
)


skip_errors_default = False

geom_cast_params_default = dict(
    geometry_type=TOGGLE.AUTO,
    is_multi=TOGGLE.AUTO,
    has_z=TOGGLE.AUTO,
)


fid_params_default = dict(fid_source=FID_SOURCE.SEQUENCE, fid_field=[])


class VectorLayerField(Base, LayerField):
    identity = "vector_layer"

    __tablename__ = LayerField.__tablename__ + "_" + identity
    __mapper_args__ = dict(polymorphic_identity=identity)

    id = db.Column(db.ForeignKey(LayerField.id), primary_key=True)
    fld_uuid = db.Column(db.Unicode(32), nullable=False)


@implementer(
    IFeatureLayer,
    IFieldEditableFeatureLayer,
    IGeometryEditableFeatureLayer,
    IWritableFeatureLayer,
    IBboxLayer,
)
class VectorLayer(Base, Resource, SpatialLayerMixin, LayerFieldsMixin):
    identity = "vector_layer"
    cls_display_name = _("Vector layer")

    __scope__ = DataScope

    tbl_uuid = db.Column(db.Unicode(32), nullable=False)
    geometry_type = db.Column(db.Enum(*GEOM_TYPE.enum), nullable=False)
    column_from_const = db.Column(db.Unicode, nullable=True)
    column_key = db.Column(db.Integer, nullable=True)
    column_constraint = db.Column(db.Unicode, nullable=True)
    fld_field_op = db.Column(db.JSONB, nullable=True)

    __field_class__ = VectorLayerField

    def __init__(self, *args, **kwagrs):
        if "tbl_uuid" not in kwagrs:
            kwagrs["tbl_uuid"] = uuid.uuid4().hex
        super().__init__(*args, **kwagrs)

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    @property
    def _tablename(self):
        return "layer_%s" % self.tbl_uuid

    def _drop_table(self, connection):
        tableinfo = TableInfo.from_layer(self)
        tableinfo.setup_metadata(self._tablename)
        tableinfo.metadata.drop_all(bind=connection)

    def from_ogr(self, filename, *, layername=None):
        ds = read_dataset_vector(filename)
        layer = ds.GetLayerByName(layername) if layername is not None else ds.GetLayer(0)
        with DBSession.no_autoflush:
            self.setup_from_ogr(layer)
            self.load_from_ogr(layer, validate=False)
        return self

    def setup_from_ogr(
        self,
        ogrlayer,
        skip_other_geometry_types=False,
        fid_params=fid_params_default,
        geom_cast_params=geom_cast_params_default,
        fix_errors=ERROR_FIX.default,
    ):
        tableinfo = TableInfo.from_ogrlayer(
            ogrlayer, self.srs, skip_other_geometry_types, fid_params, geom_cast_params, fix_errors
        )
        tableinfo.setup_layer(self)

        tableinfo.setup_metadata(self._tablename)
        tableinfo.metadata.create_all(bind=DBSession.connection())

        self.tableinfo = tableinfo

    def setup_from_fields(self, fields):
        tableinfo = TableInfo.from_fields(fields, self.srs, self.geometry_type)
        tableinfo.setup_layer(self)

        tableinfo.setup_metadata(self._tablename)
        tableinfo.metadata.create_all(bind=DBSession.connection())

        self.tableinfo = tableinfo

    def load_from_ogr(
        self,
        ogrlayer,
        skip_other_geometry_types=False,
        fix_errors=ERROR_FIX.default,
        skip_errors=skip_errors_default,
        validate=True,
    ):
        size = self.tableinfo.load_from_ogr(
            ogrlayer, skip_other_geometry_types, fix_errors, skip_errors, validate
        )

        env.core.reserve_storage(COMP_ID, VectorLayerData, value_data_volume=size, resource=self)

    def get_info(self):
        return super().get_info() + (
            (_("Geometry type"), dict(zip(GEOM_TYPE.enum, GEOM_TYPE_DISPLAY))[self.geometry_type]),
            (_("Feature count"), self.feature_query()().total_count),
        )

    # IFeatureLayer

    @property
    def feature_query(self):
        srs_supported_ = [row[0] for row in DBSession.query(SRS.id).all()]

        class BoundFeatureQuery(FeatureQueryBase):
            layer = self
            srs_supported = srs_supported_

        return BoundFeatureQuery

    def field_by_keyname(self, keyname):
        for f in self.fields:
            if f.keyname == keyname:
                return f

        raise KeyError("Field '%s' not found!" % keyname)

    # IFieldEditableFeatureLayer

    def field_create(self, datatype):
        uid = uuid.uuid4().hex
        column = db.Column("fld_" + uid, FIELD_TYPE_2_DB[datatype])

        connection = inspect(self).session.connection()
        dialect = connection.engine.dialect
        connection.execute(
            db.text(
                "ALTER TABLE {}.{} ADD COLUMN {} {}".format(
                    SCHEMA,
                    self._tablename,
                    column.name,
                    column.type.compile(dialect),
                )
            )
        )

        return VectorLayerField(datatype=datatype, fld_uuid=uid)

    def field_delete(self, field):
        column_name = "fld_" + field.fld_uuid
        DBSession.delete(field)

        connection = inspect(self).session.connection()
        connection.execute(
            db.text(
                "ALTER TABLE {}.{} DROP COLUMN {}".format(
                    SCHEMA,
                    self._tablename,
                    column_name,
                )
            )
        )

    # IGeometryEditableFeatureLayer

    def geometry_type_change(self, geometry_type):
        if self.geometry_type == geometry_type:
            return

        for cls in (GEOM_TYPE.points, GEOM_TYPE.linestrings, GEOM_TYPE.polygons):
            if self.geometry_type in cls:
                geom_cls = cls
                break

        if geometry_type not in geom_cls:
            raise VE(
                message="Can't convert {0} geometry type to {1}.".format(
                    self.geometry_type, geometry_type
                )
            )

        is_multi_1 = self.geometry_type in GEOM_TYPE.is_multi
        is_multi_2 = geometry_type in GEOM_TYPE.is_multi
        has_z_1 = self.geometry_type in GEOM_TYPE.has_z
        has_z_2 = geometry_type in GEOM_TYPE.has_z

        column_geom = db.Column("geom")
        column_type_new = ga.types.Geometry(geometry_type=geometry_type, srid=self.srs_id)

        expr = column_geom

        if is_multi_1 and not is_multi_2:  # Multi -> single
            expr = func.ST_GeometryN(expr, 1)
        elif not is_multi_1 and is_multi_2:  # Single -> multi
            expr = func.ST_Multi(expr)

        if has_z_1 and not has_z_2:  # Z -> not Z
            expr = func.ST_Force2D(expr)
        elif not has_z_1 and has_z_2:  # not Z -> Z
            expr = func.ST_Force3D(expr)

        text = db.text(
            "ALTER TABLE {}.{} ALTER COLUMN {} TYPE {} USING {}".format(
                SCHEMA,
                self._tablename,
                column_geom,
                column_type_new,
                expr.compile(compile_kwargs=dict(literal_binds=True)),
            )
        )
        connection = inspect(self).session.connection()
        connection.execute(text)

        self.geometry_type = geometry_type

    # IWritableFeatureLayer

    def feature_put(self, feature):
        tableinfo = TableInfo.from_layer(self)
        tableinfo.setup_metadata(self._tablename)

        obj = tableinfo.model(id=feature.id)
        for f in tableinfo.fields:
            if f.keyname in feature.fields:
                setattr(obj, f.key, feature.fields[f.keyname])

        # FIXME: Don't try to write geometry if it exists.
        # This will not let to write empty geometry, but it is not needed yet.

        if feature.geom is not None:
            obj.geom = ga.elements.WKBElement(bytearray(feature.geom.wkb), srid=self.srs_id)

        DBSession.merge(obj)

        on_data_change.fire(self, feature.geom)
        # TODO: Old geom version

    def feature_create(self, feature):
        """Insert new object to DB which is described in feature

        :param feature: object description
        :type feature:  Feature

        :return:    inserted object ID
        """

        tableinfo = TableInfo.from_layer(self)
        tableinfo.setup_metadata(self._tablename)

        obj = tableinfo.model()
        for f in tableinfo.fields:
            if f.keyname in feature.fields.keys():
                setattr(obj, f.key, feature.fields[f.keyname])

        obj.geom = ga.elements.WKBElement(bytearray(feature.geom.wkb), srid=self.srs_id)

        shape = feature.geom.shape
        geom_type = shape.geom_type.upper()
        if shape.has_z:
            geom_type += "Z"
        if geom_type != self.geometry_type:
            raise VE(
                _("Geometry type (%s) does not match geometry column type (%s).")
                % (geom_type, self.geometry_type)
            )

        DBSession.add(obj)
        DBSession.flush()
        DBSession.refresh(obj)

        on_data_change.fire(self, feature.geom)

        return obj.id

    def feature_delete(self, feature_id):
        """Remove record with id

        :param feature_id: record id
        :type feature_id:  int or bigint
        """

        tableinfo = TableInfo.from_layer(self)
        tableinfo.setup_metadata(self._tablename)

        query = self.feature_query()
        query.geom()
        feature = query_feature_or_not_found(query, self.id, feature_id)
        obj = DBSession.query(tableinfo.model).filter_by(id=feature.id).one()
        DBSession.delete(obj)

        on_data_change.fire(self, feature.geom)

    def feature_delete_all(self):
        """Remove all records from a layer"""

        tableinfo = TableInfo.from_layer(self)
        tableinfo.setup_metadata(self._tablename)

        DBSession.query(tableinfo.model).delete()

        geom = box(self.srs.minx, self.srs.miny, self.srs.maxx, self.srs.maxy)
        on_data_change.fire(self, geom)

    # IBboxLayer implementation:
    @property
    def extent(self):
        return calculate_extent(self)


def estimate_vector_layer_data(resource):
    tableinfo = TableInfo.from_layer(resource)
    tableinfo.setup_metadata(resource._tablename)
    table = tableinfo.table

    static_size = FIELD_TYPE_SIZE[FIELD_TYPE.INTEGER]  # ID field size
    string_columns = []
    for f in tableinfo.fields:
        if f.datatype == FIELD_TYPE.STRING:
            string_columns.append(f.key)
        else:
            static_size += FIELD_TYPE_SIZE[f.datatype]

    size_columns = [
        func.length(func.ST_AsBinary(table.columns.geom)),
    ]
    for key in string_columns:
        size_columns.append(func.coalesce(func.octet_length(table.columns[key]), 0))

    columns = [
        func.count(1),
    ] + [func.coalesce(func.sum(c), 0) for c in size_columns]

    query = sql.select(*columns)
    row = DBSession.connection().execute(query).fetchone()

    num_features = row[0]
    dynamic_size = sum(row[1:])
    size = static_size * num_features + dynamic_size

    return size


# Create vector_layer schema on table creation
event.listen(
    VectorLayer.__table__, "after_create", db.DDL("CREATE SCHEMA %s" % SCHEMA), propagate=True
)

# Drop vector_layer schema on table creation
event.listen(
    VectorLayer.__table__,
    "after_drop",
    db.DDL("DROP SCHEMA IF EXISTS %s CASCADE" % SCHEMA),
    propagate=True,
)


# Drop data table on vector layer deletion
@event.listens_for(VectorLayer, "before_delete")
def drop_verctor_layer_table(mapper, connection, target):
    target._drop_table(connection)


class _source_attr(SP):
    def _ogrds(self, filename, source_filename=None):
        ogrds = read_dataset_vector(
            filename,
            source_filename=source_filename,
        )

        if ogrds is None:
            ogrds = ogr.Open(filename, 0)
            if ogrds is None:
                raise VE(message=_("GDAL library failed to open file."))
            else:
                drivername = ogrds.GetDriver().GetName()
                raise VE(message=_("Unsupport OGR driver: %s.") % drivername)

        return ogrds

    def _ogrlayer(self, ogrds, layer_name=None):
        if layer_name is not None:
            ogrlayer = ogrds.GetLayerByName(layer_name)
        else:
            if ogrds.GetLayerCount() < 1:
                raise VE(message=_("Dataset doesn't contain layers."))

            if ogrds.GetLayerCount() > 1:
                raise VE(message=_("Dataset contains more than one layer."))

            ogrlayer = ogrds.GetLayer(0)

        if ogrlayer is None:
            raise VE(message=_("Unable to open layer."))

        # Do not trust geometry type of shapefiles
        if ogrds.GetDriver().ShortName == DRIVERS.ESRI_SHAPEFILE:
            ogrlayer.GetGeomType = lambda: ogr.wkbUnknown

        return ogrlayer

    def _setup_layer(
        self,
        obj,
        ogrlayer,
        skip_other_geometry_types,
        fix_errors,
        skip_errors,
        geom_cast_params,
        fid_params,
    ):
        try:
            # Apparently OGR_XLSX_HEADERS is taken into account during the GetSpatialRef call
            gdal.SetConfigOption("OGR_XLSX_HEADERS", "FORCE")
            if ogrlayer.GetSpatialRef() is None:
                raise VE(message=_("Layer doesn't contain coordinate system information."))
        finally:
            gdal.SetConfigOption("OGR_XLSX_HEADERS", None)

        with DBSession.no_autoflush:
            obj.setup_from_ogr(
                ogrlayer, skip_other_geometry_types, fid_params, geom_cast_params, fix_errors
            )
            obj.load_from_ogr(ogrlayer, skip_other_geometry_types, fix_errors, skip_errors)

    def setter(self, srlzr, value):
        if srlzr.obj.id is not None:
            srlzr.obj._drop_table(DBSession.connection())
            srlzr.obj.tbl_uuid = uuid.uuid4().hex

        datafile, metafile = env.file_upload.get_filename(value["id"])

        ogrds = self._ogrds(datafile, source_filename=value.get("name"))

        layer_name = srlzr.data.get("source_layer")
        ogrlayer = self._ogrlayer(ogrds, layer_name=layer_name)

        skip_other_geometry_types = srlzr.data.get("skip_other_geometry_types")

        fix_errors = srlzr.data.get("fix_errors", ERROR_FIX.default)
        if fix_errors not in ERROR_FIX.enum:
            raise VE(message=_("Unknown 'fix_errors' value."))

        skip_errors = srlzr.data.get("skip_errors", skip_errors_default)

        geometry_type = srlzr.data.get(
            "cast_geometry_type", geom_cast_params_default["geometry_type"]
        )
        if geometry_type not in (None, "POINT", "LINESTRING", "POLYGON"):
            raise VE(message=_("Unknown 'cast_geometry_type' value."))

        is_multi = srlzr.data.get("cast_is_multi", geom_cast_params_default["is_multi"])
        if is_multi not in TOGGLE.enum:
            raise VE(message=_("Unknown 'cast_is_multi' value."))

        has_z = srlzr.data.get("cast_has_z", geom_cast_params_default["has_z"])
        if has_z not in TOGGLE.enum:
            raise VE(message=_("Unknown 'cast_has_z' value."))

        geom_cast_params = dict(geometry_type=geometry_type, is_multi=is_multi, has_z=has_z)

        fid_source = srlzr.data.get("fid_source", fid_params_default["fid_source"])
        fid_field_param = srlzr.data.get("fid_field")
        fid_field = (
            fid_params_default["fid_field"]
            if fid_field_param is None
            else re.split(r"\s*,\s*", fid_field_param)
        )

        fid_params = dict(fid_source=fid_source, fid_field=fid_field)

        self._setup_layer(
            srlzr.obj,
            ogrlayer,
            skip_other_geometry_types,
            fix_errors,
            skip_errors,
            geom_cast_params,
            fid_params,
        )


class _fields_attr(SP):
    def setter(self, srlzr, value):
        with DBSession.no_autoflush:
            srlzr.obj.setup_from_fields(value)


class _geometry_type_attr(SP):
    def setter(self, srlzr, value):
        if value not in GEOM_TYPE.enum:
            raise VE(message=_("Unsupported geometry type."))

        if srlzr.obj.id is None:
            srlzr.obj.geometry_type = value
        elif srlzr.obj.geometry_type == value:
            pass
        else:
            srlzr.obj.geometry_type_change(value)


class _delete_all_features_attr(SP):
    def setter(self, srlzr, value):
        if value:
            srlzr.obj.feature_delete_all()


P_DSS_READ = DataStructureScope.read
P_DSS_WRITE = DataStructureScope.write
P_DS_READ = DataScope.read
P_DS_WRITE = DataScope.write


class VectorLayerSerializer(Serializer):
    identity = VectorLayer.identity
    resclass = VectorLayer

    srs = SR(read=P_DSS_READ, write=P_DSS_WRITE)

    source = _source_attr(write=P_DS_WRITE)

    geometry_type = _geometry_type_attr(read=P_DSS_READ, write=P_DSS_WRITE)
    column_from_const = SP(read=P_DSS_READ, write=P_DSS_WRITE)
    column_key = SP(read=P_DSS_READ, write=P_DSS_WRITE)
    column_constraint = SP(read=P_DSS_READ, write=P_DSS_WRITE)
    fld_field_op = SP(read=P_DSS_READ, write=P_DSS_WRITE)
    fields = _fields_attr(write=P_DS_WRITE)

    delete_all_features = _delete_all_features_attr(write=P_DS_WRITE)
