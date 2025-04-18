import re
from contextlib import contextmanager
from enum import Enum
from typing import Literal, Union

import sqlalchemy as sa
import sqlalchemy.event as sa_event
import sqlalchemy.orm as orm
from msgspec import UNSET
from shapely.geometry import box
from sqlalchemy import alias, bindparam, cast, func, select, sql, text
from sqlalchemy import and_ as sql_and
from sqlalchemy import or_ as sql_or
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine.url import URL as EngineURL
from sqlalchemy.engine.url import make_url as make_engine_url
from sqlalchemy.exc import NoSuchTableError, OperationalError, SQLAlchemyError
from zope.interface import implementer

from nextgisweb.env import Base, env, gettext
from nextgisweb.lib import saext
from nextgisweb.lib.logging import logger

from nextgisweb.core.exception import ForbiddenError, ValidationError
from nextgisweb.feature_layer import (
    FIELD_TYPE,
    Feature,
    FeatureQueryIntersectsMixin,
    FeatureSet,
    IFeatureLayer,
    IFeatureQuery,
    IFeatureQueryFilter,
    IFeatureQueryFilterBy,
    IFeatureQueryIlike,
    IFeatureQueryIntersects,
    IFeatureQueryLike,
    IFeatureQueryOrderBy,
    IWritableFeatureLayer,
    LayerField,
    LayerFieldsMixin,
)
from nextgisweb.layer import IBboxLayer
from nextgisweb.resource import (
    ConnectionScope,
    CRUTypes,
    DataScope,
    Resource,
    ResourceGroup,
    ResourceScope,
    SAttribute,
    SColumn,
    Serializer,
    SResource,
)

from .exception import ExternalDatabaseError

Base.depends_on("resource", "feature_layer")

class SSLMode(Enum):
    disable = "disable"
    allow = "allow"
    prefer = "prefer"
    require = "require"
    verify_ca = "verify-ca"
    verify_full = "verify-full"


class TablenogeomConnection(Base, Resource):
    identity = "tablenogeom_connection"
    cls_display_name = gettext("Tablenogeom connection")

    __scope__ = ConnectionScope

    hostname = sa.Column(sa.Unicode, nullable=False)
    database = sa.Column(sa.Unicode, nullable=False)
    username = sa.Column(sa.Unicode, nullable=False)
    password = sa.Column(sa.Unicode, nullable=False)
    port = sa.Column(sa.Integer, nullable=True)
    sslmode = sa.Column(saext.Enum(SSLMode), nullable=True)

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    def get_engine(self):
        comp = env.tablenogeom

        # Need to check connection params to see if
        # they changed for each connection request
        credhash = (
            self.hostname,
            self.port,
            self.sslmode,
            self.database,
            self.username,
            self.password,
        )

        if self.id in comp._engine:
            engine = comp._engine[self.id]

            if engine._credhash == credhash:
                return engine

            else:
                del comp._engine[self.id]

        connect_timeout = int(comp.options["connect_timeout"].total_seconds())
        statement_timeout_ms = int(comp.options["statement_timeout"].total_seconds()) * 1000
        args = dict(
            client_encoding="utf-8",
            connect_args=dict(
                connect_timeout=connect_timeout,
                options="-c statement_timeout=%d" % statement_timeout_ms,
            ),
        )
        if self.sslmode is not None:
            args["connect_args"]["sslmode"] = self.sslmode.value

        engine_url = make_engine_url(
            EngineURL.create(
                "postgresql+psycopg2",
                host=self.hostname,
                port=self.port,
                database=self.database,
                username=self.username,
                password=self.password,
            )
        )
        engine = sa.create_engine(engine_url, **args)

        resid = self.id

        @sa_event.listens_for(engine, "connect")
        def _connect(dbapi, record):
            logger.debug(
                "Resource #%d, pool 0x%x, connection 0x%x created", resid, id(dbapi), id(engine)
            )

        @sa_event.listens_for(engine, "checkout")
        def _checkout(dbapi, record, proxy):
            logger.debug(
                "Resource #%d, pool 0x%x, connection 0x%x retrieved", resid, id(dbapi), id(engine)
            )

        @sa_event.listens_for(engine, "checkin")
        def _checkin(dbapi, record):
            logger.debug(
                "Resource #%d, pool 0x%x, connection 0x%x returned", resid, id(dbapi), id(engine)
            )

        engine._credhash = credhash

        comp._engine[self.id] = engine
        return engine

    @contextmanager
    def get_connection(self):
        try:
            conn = self.get_engine().connect()
        except OperationalError:
            raise ValidationError(gettext("Cannot connect to the database!"))

        try:
            yield conn
        except SQLAlchemyError as exc:
            raise ExternalDatabaseError(sa_error=exc)
        finally:
            conn.close()


class SSLModeAttr(SColumn):
    ctypes = CRUTypes(Union[SSLMode, None], Union[SSLMode, None], Union[SSLMode, None])


class TablenogeomConnectionSerializer(Serializer, resource=TablenogeomConnection):
    hostname = SColumn(read=ConnectionScope.read, write=ConnectionScope.write)
    port = SColumn(read=ConnectionScope.read, write=ConnectionScope.write)
    sslmode = SSLModeAttr(read=ConnectionScope.read, write=ConnectionScope.write)
    username = SColumn(read=ConnectionScope.read, write=ConnectionScope.write)
    password = SColumn(read=ConnectionScope.read, write=ConnectionScope.write)
    database = SColumn(read=ConnectionScope.read, write=ConnectionScope.write)


class TablenogeomLayerField(Base, LayerField):
    identity = "tablenogeom_layer"

    __tablename__ = LayerField.__tablename__ + "_" + identity
    __mapper_args__ = dict(polymorphic_identity=identity)

    id = sa.Column(sa.ForeignKey(LayerField.id), primary_key=True)
    column_name = sa.Column(sa.Unicode, nullable=False)


@implementer(IFeatureLayer, IWritableFeatureLayer, IBboxLayer)
class TablenogeomLayer(Base, Resource, LayerFieldsMixin):
    identity = "tablenogeom_layer"
    cls_display_name = gettext("Tablenogeom layer")

    __scope__ = DataScope

    connection_id = sa.Column(sa.ForeignKey(Resource.id), nullable=False)
    schema = sa.Column(sa.Unicode, default="public", nullable=False)
    table = sa.Column(sa.Unicode, nullable=False)
    column_id = sa.Column(sa.Unicode, nullable=False)

    __field_class__ = TablenogeomLayerField

    connection = orm.relationship(
        Resource,
        foreign_keys=connection_id,
        cascade="save-update, merge",
    )

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    @property
    def source(self):
        source_meta = super().source
        source_meta.update(
            dict(
                schema=self.schema,
                table=self.table,
                column_id=self.column_id,
            )
        )
        return source_meta

    def setup(self):
        fdata = dict()
        for f in self.fields:
            fdata[f.keyname] = dict(display_name=f.display_name, grid_visibility=f.grid_visibility)

        for f in list(self.fields):
            self.fields.remove(f)

        self.feature_label_field = None

        with self.connection.get_connection() as conn:
            inspector = sa.inspect(conn.engine)
            try:
                columns = inspector.get_columns(self.table, self.schema)
            except NoSuchTableError:
                raise ValidationError(
                    gettext("Table '%(table)s' not found!")
                    % dict(table=f"{self.schema}.{self.table}")
                )

            colfound_id = False

            for column in columns:
                if column["name"] == self.column_id:
                    if not isinstance(column["type"], sa.Integer):
                        raise ValidationError(
                            gettext("To use column as ID it should have integer type!")
                        )
                    colfound_id = True

                else:
                    if isinstance(column["type"], sa.BigInteger):
                        datatype = FIELD_TYPE.BIGINT
                    elif isinstance(column["type"], sa.Integer):
                        datatype = FIELD_TYPE.INTEGER
                    elif isinstance(column["type"], sa.Numeric):
                        datatype = FIELD_TYPE.REAL
                    elif isinstance(column["type"], (sa.String, UUID)):
                        datatype = FIELD_TYPE.STRING
                    elif isinstance(column["type"], sa.Date):
                        datatype = FIELD_TYPE.DATE
                    elif isinstance(column["type"], sa.Time):
                        datatype = FIELD_TYPE.TIME
                    elif isinstance(column["type"], sa.DateTime):
                        datatype = FIELD_TYPE.DATETIME
                    else:
                        logger.warning(f"Column type '{column['type']}' is not supported.")
                        continue

                    fopts = dict(display_name=column["name"])
                    fopts.update(fdata.get(column["name"], dict()))
                    self.fields.append(
                        TablenogeomLayerField(
                            keyname=column["name"],
                            datatype=datatype,
                            column_name=column["name"],
                            **fopts,
                        )
                    )

            if not colfound_id:
                raise ValidationError(
                    gettext("Column '%(column)s' not found!") % dict(column=self.column_id)
                )

    # IFeatureLayer

    @property
    def feature_query(self):
        class BoundFeatureQuery(FeatureQueryBase):
            layer = self

        return BoundFeatureQuery

    def field_by_keyname(self, keyname):
        for f in self.fields:
            if f.keyname == keyname:
                return f

        raise KeyError("Field '%s' not found!" % keyname)

    # IWritableFeatureLayer

    def _sa_table(self, init_columns=False):
        cols = []
        if init_columns:
            cols.extend([sa.sql.column(f.column_name) for f in self.fields])
            cols.append(sa.sql.column(self.column_id))

        tab = sa.sql.table(self.table, *cols)
        tab.schema = self.schema
        tab.quote = True
        tab.quote_schema = True

        return tab

    def _makevals(self, feature):
        values = dict()

        for f in self.fields:
            if f.keyname in feature.fields.keys():
                values[f.column_name] = feature.fields[f.keyname]

        return values

    def feature_put(self, feature):
        """Update existing object

        :param feature: object description
        :type feature:  Feature
        """
        idcol = sa.sql.column(self.column_id)
        tab = self._sa_table(True)
        stmt = sa.update(tab).values(self._makevals(feature)).where(idcol == feature.id)

        with self.connection.get_connection() as conn:
            conn.execute(stmt)

    def feature_create(self, feature):
        """Insert new object to DB which is described in feature

        :param feature: object description
        :type feature:  Feature

        :return:    inserted object ID
        """
        idcol = sa.sql.column(self.column_id)
        tab = self._sa_table(True)
        stmt = sa.insert(tab).values(self._makevals(feature)).returning(idcol)

        with self.connection.get_connection() as conn:
            return conn.execute(stmt).scalar()

    def feature_delete(self, feature_id):
        """Remove record with id

        :param feature_id: record id
        :type feature_id:  int or bigint
        """
        idcol = sa.sql.column(self.column_id)
        tab = self._sa_table()
        stmt = sa.delete(tab).where(idcol == feature_id)

        with self.connection.get_connection() as conn:
            conn.execute(stmt)

    def feature_delete_all(self):
        """Remove all records from a layer"""
        tab = self._sa_table()
        stmt = sa.delete(tab)

        with self.connection.get_connection() as conn:
            conn.execute(stmt)

DataScope.read.require(ConnectionScope.connect, attr="connection", cls=TablenogeomLayer)


class FieldsAttr(SAttribute):
    def set(
        self,
        srlzr: Serializer,
        value: Union[Literal["update"], Literal["keep"]],
        *,
        create: bool,
    ):
        if value == "update":
            if srlzr.obj.connection.has_permission(ConnectionScope.connect, srlzr.user):
                srlzr.obj.setup()
            else:
                raise ForbiddenError()


class TablenogeomLayerSerializer(Serializer, resource=TablenogeomLayer):
    connection = SResource(read=ResourceScope.read, write=ResourceScope.update)
    schema = SColumn(read=ResourceScope.read, write=ResourceScope.update)
    table = SColumn(read=ResourceScope.read, write=ResourceScope.update)
    column_id = SColumn(read=ResourceScope.read, write=ResourceScope.update)

    fields = FieldsAttr(read=None, write=ResourceScope.update)


@implementer(
    IFeatureQuery,
    IFeatureQueryFilter,
    IFeatureQueryFilterBy,
    IFeatureQueryLike,
    IFeatureQueryIlike,
    IFeatureQueryIntersects,
    IFeatureQueryOrderBy,
)
class FeatureQueryBase(FeatureQueryIntersectsMixin):
    def __init__(self):
        super().__init__()

        self._fields = None
        self._limit = None
        self._offset = None

        self._filter = None
        self._filter_by = None
        self._like = None
        self._ilike = None

        self._order_by = None

    def fields(self, *args):
        self._fields = args

    def limit(self, limit, offset=0):
        self._limit = limit
        self._offset = offset

    def filter(self, *args):
        self._filter = args

    def filter_by(self, **kwargs):
        self._filter_by = kwargs

    def order_by(self, *args):
        self._order_by = args

    def like(self, value):
        self._like = value

    def ilike(self, value):
        self._ilike = value

    def __call__(self):
        tab = alias(self.layer._sa_table(True), name="tab")

        idcol = tab.columns[self.layer.column_id]
        columns = [idcol.label("id")]
        where = [idcol.isnot(None)]

        selected_fields = []
        for idx, fld in enumerate(self.layer.fields):
            if self._fields is None or fld.keyname in self._fields:
                label = f"fld_{idx}"
                columns.append(getattr(tab.columns, fld.column_name).label(label))
                selected_fields.append((fld.keyname, label))

        if self._filter_by:
            for k, v in self._filter_by.items():
                if k == "id":
                    where.append(idcol == v)
                else:
                    field = self.layer.field_by_keyname(k)
                    where.append(tab.columns[field.column_name] == v)

        if self._filter:
            _where_filter = []
            for k, o, v in self._filter:
                supported_operators = (
                    "eq",
                    "ne",
                    "isnull",
                    "ge",
                    "gt",
                    "le",
                    "lt",
                    "like",
                    "ilike",
                )
                if o not in supported_operators:
                    raise ValueError(
                        "Invalid operator '%s'. Only %r are supported." % (o, supported_operators)
                    )

                if o == "like":
                    o = "like_op"
                elif o == "ilike":
                    o = "ilike_op"
                elif o == "isnull":
                    if v == "yes":
                        o = "is_"
                    elif v == "no":
                        o = "isnot"
                    else:
                        raise ValueError("Invalid value '%s' for operator '%s'." % (v, o))
                    v = sa.sql.null()

                op = getattr(sa.sql.operators, o)
                if k == "id":
                    column = idcol
                else:
                    field = self.layer.field_by_keyname(k)
                    column = tab.columns[field.column_name]

                _where_filter.append(op(column, v))

            if len(_where_filter) > 0:
                where.append(sa.and_(*_where_filter))

        if self._like or self._ilike:
            operands = [
                cast(tab.columns[fld.column_name], sa.Unicode)
                for fld in self.layer.fields
                if fld.text_search
            ]
            if len(operands) == 0:
                where.append(False)
            else:
                method, value = ("like", self._like) if self._like else ("ilike", self._ilike)
                where.append(sa.or_(*(getattr(op, method)(f"%{value}%") for op in operands)))

        order_criterion = []
        if self._order_by:
            for order, k in self._order_by:
                field = self.layer.field_by_keyname(k)
                order_criterion.append(
                    dict(asc=sa.asc, desc=sa.desc)[order](tab.columns[field.column_name])
                )
        order_criterion.append(idcol)

        class QueryFeatureSet(FeatureSet):
            layer = self.layer

            _fields = self._fields
            _limit = self._limit
            _offset = self._offset

            def __iter__(self):
                query = (
                    sql.select(*columns)
                    .limit(self._limit)
                    .offset(self._offset)
                    .order_by(*order_criterion)
                )

                if len(where) > 0:
                    query = query.where(sa.and_(*where))

                with self.layer.connection.get_connection() as conn:
                    result = conn.execute(query)
                    for row in result.mappings():
                        fdict = dict((keyname, row[label]) for keyname, label in selected_fields)

                        yield Feature(
                            layer=self.layer,
                            id=row.id,
                            fields=fdict,
                        )

            @property
            def total_count(self):
                with self.layer.connection.get_connection() as conn:
                    query = sql.select(func.count(idcol))
                    if len(where) > 0:
                        query = query.where(sa.and_(*where))
                    result = conn.execute(query)
                    return result.scalar()

        return QueryFeatureSet()