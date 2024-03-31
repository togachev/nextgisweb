from nextgisweb.env import _
from nextgisweb.lib.dynmenu import Link

from nextgisweb.pyramid import viewargs
from nextgisweb.resource import ConnectionScope, DataScope, Resource, Widget, resource_factory

from .model import PostgisConnection, PostgisLayer


class PostgisConnectionWidget(Widget):
    resource = PostgisConnection
    operation = ("create", "update")
    amdmod = "ngw-postgis/ConnectionWidget"


class PostgisLayerWidget(Widget):
    resource = PostgisLayer
    operation = ("create", "update")
    amdmod = "ngw-postgis/LayerWidget"


def setup_pyramid(comp, config):
    config.add_route(
        "postgis.diagnostics_page",
        r"/resource/{id:uint}/postgis-diagnostics",
        factory=resource_factory,
    ).add_view(diagnostics_page, context=PostgisConnection).add_view(
        diagnostics_page, context=PostgisLayer
    )

    @Resource.__dynmenu__.add
    def _resource_dynmenu(args):
        if (
            isinstance(args.obj, (PostgisConnection, PostgisLayer))
            and args.request.user.keyname != "guest"
        ):
            yield Link(
                "extra/postgis-diagnostics",
                _("Diagnostics"),
                lambda args: args.request.route_url("postgis.diagnostics_page", id=args.obj.id),
                icon="material-flaky",
            )


@viewargs(renderer="react")
def diagnostics_page(context, request):
    if isinstance(context, PostgisConnection):
        request.resource_permission(ConnectionScope.connect)
        data = dict(connection=dict(id=context.id))
    elif isinstance(context, PostgisLayer):
        request.resource_permission(DataScope.read)
        data = dict(connection=dict(id=context.connection.id), layer=dict(id=context.id))
    else:
        raise ValueError

    return dict(
        entrypoint="@nextgisweb/postgis/diagnostics-widget",
        props=dict(data=data),
        title=_("PostGIS diagnostics"),
        obj=request.context,
    )
