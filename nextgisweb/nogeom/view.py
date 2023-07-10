from nextgisweb.env import _
from nextgisweb.lib.dynmenu import DynItem, Link

from nextgisweb.pyramid import viewargs
from nextgisweb.resource import ConnectionScope, DataScope, Resource, Widget, resource_factory

from .model import NogeomConnection, NogeomLayer


class NogeomConnectionWidget(Widget):
    resource = NogeomConnection
    operation = ('create', 'update')
    amdmod = 'ngw-nogeom/ConnectionWidget'


class NogeomLayerWidget(Widget):
    resource = NogeomLayer
    operation = ('create', 'update')
    amdmod = 'ngw-nogeom/LayerWidget'


def setup_pyramid(comp, config):
    config.add_route(
        "nogeom.diagnostics_page",
        r"/resource/{id:\d+}/nogeom-diagnostics",
        factory=resource_factory
    ) \
        .add_view(diagnostics_page, context=NogeomConnection) \
        .add_view(diagnostics_page, context=NogeomLayer)

    class NogeomMenu(DynItem):
        def build(self, args):
            if isinstance(args.obj, (NogeomConnection, NogeomLayer)):
                yield Link(
                    'extra/nogeom-diagnostics', _("Diagnostics"),
                    lambda args: args.request.route_url(
                        'nogeom.diagnostics_page', id=args.obj.id),
                    icon="material-flaky")

    Resource.__dynmenu__.add(NogeomMenu())


@viewargs(renderer='react')
def diagnostics_page(context, request):
    if isinstance(context, NogeomConnection):
        request.resource_permission(ConnectionScope.connect)
        data = dict(connection=dict(id=context.id))
    elif isinstance(context, NogeomLayer):
        request.resource_permission(DataScope.read)
        data = dict(
            connection=dict(id=context.connection.id),
            layer=dict(id=context.id))
    else:
        raise ValueError

    return dict(
        entrypoint='@nextgisweb/nogeom/diagnostics-widget',
        props=dict(data=data), title=_("NoGeom diagnostics"),
        obj=request.context,
    )
