from nextgisweb.env import gettext
from nextgisweb.lib.dynmenu import Link

from nextgisweb.pyramid import viewargs
from nextgisweb.resource import ConnectionScope, DataScope, Resource, Widget, resource_factory

from .model import TablenogeomConnection, TablenogeomLayer


class TablenogeomConnectionWidget(Widget):
    resource = TablenogeomConnection
    operation = ("create", "update")
    amdmod = "@nextgisweb/tablenogeom/connection-widget"


class TablenogeomLayerWidget(Widget):
    resource = TablenogeomLayer
    operation = ("create", "update")
    amdmod = "@nextgisweb/tablenogeom/layer-widget"


def setup_pyramid(comp, config):
    config.add_route(
        "tablenogeom.diagnostics_page",
        r"/resource/{id:uint}/tablenogeom-diagnostics",
        factory=resource_factory,
    ).add_view(diagnostics_page, context=TablenogeomConnection).add_view(
        diagnostics_page, context=TablenogeomLayer
    )

    @Resource.__dynmenu__.add
    def _resource_dynmenu(args):
        if (
            isinstance(args.obj, (TablenogeomConnection, TablenogeomLayer))
            and args.request.user.keyname != "guest"
        ):
            yield Link(
                "extra/tablenogeom-diagnostics",
                gettext("Diagnostics"),
                lambda args: args.request.route_url("tablenogeom.diagnostics_page", id=args.obj.id),
                icon="material-flaky",
            )


@viewargs(renderer="react")
def diagnostics_page(context, request):
    if isinstance(context, TablenogeomConnection):
        request.resource_permission(ConnectionScope.connect)
        data = dict(connection=dict(id=context.id))
    elif isinstance(context, TablenogeomLayer):
        request.resource_permission(DataScope.read)
        data = dict(connection=dict(id=context.connection.id), layer=dict(id=context.id))
    else:
        raise ValueError

    return dict(
        entrypoint="@nextgisweb/tablenogeom/diagnostics-widget",
        props=dict(data=data),
        title=gettext("Tablenogeom diagnostics"),
        obj=request.context,
    )
