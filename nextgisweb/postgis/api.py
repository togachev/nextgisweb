from sqlalchemy import inspect
from sqlalchemy.exc import NoResultFound, NoSuchTableError, SQLAlchemyError

from nextgisweb.env import _

from nextgisweb.core.exception import ValidationError
from nextgisweb.pyramid import JSONType
from nextgisweb.resource import ConnectionScope, DataStructureScope, ResourceFactory

from .diagnostics import Checker
from .exception import ExternalDatabaseError
from .model import PostgisConnection, PostgisLayer
from .util import coltype_as_str


def inspect_connection(request) -> JSONType:
    request.resource_permission(ConnectionScope.connect)

    connection = request.context
    engine = connection.get_engine()
    try:
        inspector = inspect(engine)
    except SQLAlchemyError as exc:
        raise ExternalDatabaseError(message="Failed to inspect database.", sa_error=exc)

    result = []
    for schema_name in inspector.get_schema_names():
        if schema_name != "information_schema":
            result.append(
                dict(
                    schema=schema_name,
                    views=inspector.get_view_names(schema=schema_name),
                    tables=inspector.get_table_names(schema=schema_name),
                )
            )

    return result


def inspect_table(request) -> JSONType:
    request.resource_permission(ConnectionScope.connect)

    connection = request.context
    engine = connection.get_engine()
    try:
        inspector = inspect(engine)
    except SQLAlchemyError as exc:
        raise ExternalDatabaseError(message="Failed to inspect database.", sa_error=exc)

    table_name = request.matchdict["table_name"]
    schema = request.GET.get("schema", "public")

    result = []
    try:
        for column in inspector.get_columns(table_name, schema):
            result.append(dict(name=column["name"], type=coltype_as_str(column["type"])))
    except NoSuchTableError:
        raise ValidationError(_("Table (%s) not found in schema (%s)." % (table_name, schema)))

    return result


def diagnostics(request) -> JSONType:
    # Don't allow this for guest due to security reasons.
    request.require_authenticated()

    body = request.json_body
    connection = body.get("connection")
    layer = body.get("layer")

    if layer is not None:
        if lid := layer.get("id"):
            try:
                res = PostgisLayer.filter_by(id=lid).one()
            except NoResultFound:
                raise ValidationError(message=_("PostGIS layer {} not found!").format(lid))

            # Same permission as for reading layer parameters.
            request.resource_permission(DataStructureScope.read, res)
            layer = {
                k: getattr(res, k)
                for k in (
                    "schema",
                    "table",
                    "column_id",
                    "column_geom",
                    "geometry_type",
                    "geometry_srid",
                    "fields",
                )
            }

            if connection is None:
                connection = dict(id=res.connection_id)

    if cid := connection.get("id"):
        try:
            res = PostgisConnection.filter_by(id=cid).one()
        except NoResultFound:
            raise ValidationError(message=_("PostGIS connection {} not found!").format(cid))

        request.resource_permission(ConnectionScope.connect, res)
        connection = {
            k: getattr(res, k) for k in ("hostname", "port", "database", "username", "password")
        }

    checker = Checker(connection=connection, layer=layer)
    result = dict(status=checker.status.value if checker.status else None)

    tr = request.localizer.translate
    result["checks"] = checks = list()
    for ck in checker.checks:
        ck_result = dict(status=ck.status, group=ck.group)
        if title := getattr(ck, "title", None):
            ck_result["title"] = tr(title)

        ck_result["messages"] = messages = list()
        for msg in ck.messages:
            msg_result = dict(status=msg.get("status"))
            if text := msg.get("text"):
                msg_result["text"] = tr(text)
            messages.append(msg_result)

        checks.append(ck_result)

    return result


def setup_pyramid(comp, config):
    postgis_connection_factory = ResourceFactory(context=PostgisConnection)

    config.add_route(
        "postgis.connection.inspect",
        "/api/resource/{id}/inspect/",
        factory=postgis_connection_factory,
        get=inspect_connection,
    )

    config.add_route(
        "postgis.connection.inspect.table",
        "/api/resource/{id}/inspect/{table_name:str}/",
        factory=postgis_connection_factory,
        get=inspect_table,
    )

    config.add_route(
        "postgis.diagnostics",
        "/api/component/postgis/check",
        post=diagnostics,
    )
