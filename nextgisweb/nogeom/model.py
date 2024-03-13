import re
from contextlib import contextmanager

from sqlalchemy import cast, func, select, sql, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.engine.url import URL as EngineURL
from sqlalchemy.engine.url import make_url as make_engine_url
from sqlalchemy.exc import NoSuchTableError, OperationalError, SQLAlchemyError
from zope.interface import implementer

from nextgisweb.env import Base, _, env
from nextgisweb.lib import db
from nextgisweb.lib.logging import logger

from nextgisweb.core.exception import ForbiddenError, ValidationError
from nextgisweb.feature_layer import (
    FIELD_FORBIDDEN_NAME,
    FIELD_TYPE,
    Feature,
    FeatureQueryIntersectsMixin,
    FeatureSet,
    IFeatureLayer,
    IFeatureQuery,
    IFeatureQueryFilter,
    IFeatureQueryFilterBy,
    IFeatureQueryIlike,
    IFeatureQueryLike,
    IFeatureQueryOrderBy,
    IWritableFeatureLayer,
    LayerField,
    LayerFieldsMixin,
)
from nextgisweb.layer import IBboxLayer
from nextgisweb.resource import (
    ConnectionScope,
    DataScope,
    DataStructureScope,
    Resource,
    ResourceGroup,
    Serializer,
)
from nextgisweb.resource import SerializedProperty as SP
from nextgisweb.resource import SerializedRelationship as SR
from nextgisweb.resource import SerializedResourceRelationship as SRR

from .exception import ExternalDatabaseError

Base.depends_on("resource", "feature_layer")

PC_READ = ConnectionScope.read
PC_WRITE = ConnectionScope.write
PC_CONNECT = ConnectionScope.connect

class NogeomConnection(Base, Resource):
    identity = "nogeom_connection"
    cls_display_name = _("NoGEOM connection")

    __scope__ = ConnectionScope

    hostname = db.Column(db.Unicode, nullable=False)
    database = db.Column(db.Unicode, nullable=False)
    username = db.Column(db.Unicode, nullable=False)
    password = db.Column(db.Unicode, nullable=False)
    port = db.Column(db.Integer, nullable=True)

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    def get_engine(self):
        comp = env.nogeom

        # Need to check connection params to see if
        # they changed for each connection request
        credhash = (self.hostname, self.port, self.database, self.username, self.password)

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
        engine = db.create_engine(engine_url, **args)

        resid = self.id

        @db.event.listens_for(engine, "connect")
        def _connect(dbapi, record):
            logger.debug(
                "Resource #%d, pool 0x%x, connection 0x%x created", resid, id(dbapi), id(engine)
            )

        @db.event.listens_for(engine, "checkout")
        def _checkout(dbapi, record, proxy):
            logger.debug(
                "Resource #%d, pool 0x%x, connection 0x%x retrieved", resid, id(dbapi), id(engine)
            )

        @db.event.listens_for(engine, "checkin")
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
            raise ValidationError(_("Cannot connect to the database!"))

        try:
            yield conn
        except SQLAlchemyError as exc:
            raise ExternalDatabaseError(sa_error=exc)
        finally:
            conn.close()


class NogeomConnectionSerializer(Serializer):
    identity = NogeomConnection.identity
    resclass = NogeomConnection

    hostname = SP(read=PC_READ, write=PC_WRITE)
    database = SP(read=PC_READ, write=PC_WRITE)
    username = SP(read=PC_READ, write=PC_WRITE)
    password = SP(read=PC_READ, write=PC_WRITE)
    port = SP(read=PC_READ, write=PC_WRITE)


class NogeomLayerField(Base, LayerField):
    identity = "nogeom_layer"

    __tablename__ = LayerField.__tablename__ + "_" + identity
    __mapper_args__ = dict(polymorphic_identity=identity)

    id = db.Column(db.ForeignKey(LayerField.id), primary_key=True)
    column_name = db.Column(db.Unicode, nullable=False)


@implementer(IFeatureLayer, IWritableFeatureLayer, IBboxLayer)
class NogeomLayer(Base, Resource, LayerFieldsMixin):
    identity = "nogeom_layer"
    cls_display_name = _("NoGEOM layer")

    __scope__ = DataScope

    connection_id = db.Column(db.ForeignKey(Resource.id), nullable=False)
    schema = db.Column(db.Unicode, default="public", nullable=False)
    table = db.Column(db.Unicode, nullable=False)
    column_id = db.Column(db.Unicode, nullable=False)
    column_from_const = db.Column(db.Unicode, nullable=True)
    column_key = db.Column(db.Integer, nullable=True)
    column_constraint = db.Column(db.Unicode, nullable=True)

    __field_class__ = NogeomLayerField

    connection = db.relationship(
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
                column_from_const=self.column_from_const,
                column_key=self.column_key,
                column_constraint=self.column_constraint,
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
            inspector = db.inspect(conn.engine)
            try:
                columns = inspector.get_columns(self.table, self.schema)
            except NoSuchTableError:
                raise ValidationError(
                    _("Table '%(table)s' not found!") % dict(table=f"{self.schema}.{self.table}")
                )

            colfound_id = False

            for column in columns:
                if column["name"] == self.column_id:
                    if not isinstance(column["type"], db.Integer):
                        raise ValidationError(
                            _("To use column as ID it should have integer type!")
                        )
                    colfound_id = True

                elif column["name"] in FIELD_FORBIDDEN_NAME:
                    # TODO: Currently id and geom fields break vector layer. We should fix it!
                    pass

                else:
                    if isinstance(column["type"], db.BigInteger):
                        datatype = FIELD_TYPE.BIGINT
                    elif isinstance(column["type"], db.Integer):
                        datatype = FIELD_TYPE.INTEGER
                    elif isinstance(column["type"], db.Numeric):
                        datatype = FIELD_TYPE.REAL
                    elif isinstance(column["type"], (db.String, UUID)):
                        datatype = FIELD_TYPE.STRING
                    elif isinstance(column["type"], db.Date):
                        datatype = FIELD_TYPE.DATE
                    elif isinstance(column["type"], db.Time):
                        datatype = FIELD_TYPE.TIME
                    elif isinstance(column["type"], db.DateTime):
                        datatype = FIELD_TYPE.DATETIME
                    else:
                        logger.warning(f"Column type '{column['type']}' is not supported.")
                        continue

                    fopts = dict(display_name=column["name"])
                    fopts.update(fdata.get(column["name"], dict()))
                    self.fields.append(
                        NogeomLayerField(
                            keyname=column["name"],
                            datatype=datatype,
                            column_name=column["name"],
                            **fopts,
                        )
                    )

            if not colfound_id:
                raise ValidationError(
                    _("Column '%(column)s' not found!") % dict(column=self.column_id)
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
            cols.extend([db.sql.column(f.column_name) for f in self.fields])
            cols.append(db.sql.column(self.column_id))

        tab = db.sql.table(self.table, *cols)
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
        idcol = db.sql.column(self.column_id)
        tab = self._sa_table(True)
        stmt = db.update(tab).values(self._makevals(feature)).where(idcol == feature.id)

        with self.connection.get_connection() as conn:
            conn.execute(stmt)

    def feature_create(self, feature):
        """Insert new object to DB which is described in feature

        :param feature: object description
        :type feature:  Feature

        :return:    inserted object ID
        """
        idcol = db.sql.column(self.column_id)
        tab = self._sa_table(True)
        stmt = db.insert(tab).values(self._makevals(feature)).returning(idcol)

        with self.connection.get_connection() as conn:
            return conn.execute(stmt).scalar()

    def feature_delete(self, feature_id):
        """Remove record with id

        :param feature_id: record id
        :type feature_id:  int or bigint
        """
        idcol = db.sql.column(self.column_id)
        tab = self._sa_table()
        stmt = db.delete(tab).where(idcol == feature_id)

        with self.connection.get_connection() as conn:
            conn.execute(stmt)

    def feature_delete_all(self):
        """Remove all records from a layer"""
        tab = self._sa_table()
        stmt = db.delete(tab)

        with self.connection.get_connection() as conn:
            conn.execute(stmt)

    # IBboxLayer
    @property
    def extent(self):
        return calculate_extent(self)


DataScope.read.require(ConnectionScope.connect, attr="connection", cls=NogeomLayer)


class _fields_action(SP):
    """Special write-only attribute that allows updating
    list of fields from the server"""

    def setter(self, srlzr, value):
        if value == "update":
            if srlzr.obj.connection.has_permission(PC_CONNECT, srlzr.user):
                srlzr.obj.setup()
            else:
                raise ForbiddenError()
        elif value != "keep":
            raise ValidationError("Invalid 'fields' parameter.")


class NogeomLayerSerializer(Serializer):
    identity = NogeomLayer.identity
    resclass = NogeomLayer

    __defaults = dict(read=DataStructureScope.read, write=DataStructureScope.write)

    connection = SRR(**__defaults)

    schema = SP(**__defaults)
    table = SP(**__defaults)
    column_id = SP(**__defaults)
    column_from_const = SP(**__defaults)
    column_key = SP(**__defaults)
    column_constraint = SP(**__defaults)

    fields = _fields_action(write=DataStructureScope.write)


@implementer(
    IFeatureQuery,
    IFeatureQueryFilter,
    IFeatureQueryFilterBy,
    IFeatureQueryLike,
    IFeatureQueryIlike,
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
        tab = self.layer._sa_table(True)

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
                    v = db.sql.null()

                op = getattr(db.sql.operators, o)
                if k == "id":
                    column = idcol
                else:
                    field = self.layer.field_by_keyname(k)
                    column = tab.columns[field.column_name]

                _where_filter.append(op(column, v))

            if len(_where_filter) > 0:
                where.append(db.and_(*_where_filter))

        if self._like or self._ilike:
            operands = [cast(tab.columns[f.column_name], db.Unicode) for f in self.layer.fields]
            if len(operands) == 0:
                where.append(False)
            else:
                method, value = ("like", self._like) if self._like else ("ilike", self._ilike)
                where.append(db.or_(*(getattr(op, method)(f"%{value}%") for op in operands)))

        order_criterion = []
        if self._order_by:
            for order, k in self._order_by:
                field = self.layer.field_by_keyname(k)
                order_criterion.append(
                    dict(asc=db.asc, desc=db.desc)[order](tab.columns[field.column_name])
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
                    query = query.where(db.and_(*where))

                with self.layer.connection.get_connection() as conn:
                    result = conn.execute(query)
                    for row in result.mappings():
                        fdict = dict((keyname, row[label]) for keyname, label in selected_fields)

                        yield Feature(
                            layer=self.layer,
                            id=row["id"],
                            fields=fdict,
                        )

            @property
            def total_count(self):
                with self.layer.connection.get_connection() as conn:
                    query = sql.select(func.count(idcol))
                    if len(where) > 0:
                        query = query.where(db.and_(*where))
                    result = conn.execute(query)
                    return result.scalar()


        return QueryFeatureSet()
