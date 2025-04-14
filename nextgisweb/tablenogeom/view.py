from nextgisweb.env import gettext
from nextgisweb.lib.dynmenu import Link

from nextgisweb.gui import react_renderer
from nextgisweb.jsrealm import icon, jsentry
from nextgisweb.resource import ConnectionScope, DataScope, Resource, Widget, resource_factory

from .model import TablenogeomConnection, TablenogeomLayer


class TablenogeomConnectionWidget(Widget):
    resource = TablenogeomConnection
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/tablenogeom/connection-widget")


class TablenogeomLayerWidget(Widget):
    resource = TablenogeomLayer
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/tablenogeom/layer-widget")


def setup_pyramid(comp, config):
    config.add_route(
        "tablenogeom.diagnostics_page",
        r"/resource/{id:uint}/tablenogeom-diagnostics",
        factory=resource_factory,
    ).add_view(diagnostics_page, context=TablenogeomConnection).add_view(
        diagnostics_page, context=TablenogeomLayer
    )

    icon_diagnostics = icon("material/flaky")

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
                icon=icon_diagnostics,
            )


@react_renderer("@nextgisweb/tablenogeom/diagnostics-widget")
def diagnostics_page(request):
    context = request.context

    if isinstance(context, TablenogeomConnection):
        request.resource_permission(ConnectionScope.connect)
        data = dict(connection=dict(id=context.id))
    elif isinstance(context, TablenogeomLayer):
        request.resource_permission(DataScope.read)
        data = dict(connection=dict(id=context.connection.id), layer=dict(id=context.id))
    else:
        raise ValueError

    return dict(
        props=dict(data=data),
        title=gettext("Tablenogeom diagnostics"),
        obj=request.context,
    )
