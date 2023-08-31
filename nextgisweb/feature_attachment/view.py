from pyramid.httpexceptions import HTTPNotFound

from nextgisweb.env import _
from nextgisweb.lib import dynmenu as dm

from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.pyramid import viewargs
from nextgisweb.resource import DataScope, Resource, resource_factory


@viewargs(renderer='react')
def attachment(request):
    request.resource_permission(DataScope.read)

    if not request.context.has_export_permission(request.user):
        raise HTTPNotFound()

    return dict(
        obj=request.context,
        title=_("Manage attachments"),
        props=dict(id=request.context.id),
        entrypoint="@nextgisweb/feature_attachment/attachment-form",
        maxheight=True
    )


def setup_pyramid(comp, config):
    config.add_route(
        'feature_attachment.page',
        r'/resource/{id:uint}/attachments',
        factory=resource_factory,
    ).add_view(attachment, context=IFeatureLayer)

    # Layer menu extension
    class LayerMenuExt(dm.DynItem):

        def build(self, args):
            if IFeatureLayer.providedBy(args.obj):
                if args.obj.has_export_permission(args.request.user):
                    if args.obj.cls != 'nogeom_layer':
                        yield dm.Link(
                            'feature_layer/feature_attachment', _("Manage attachments"),
                            lambda args: args.request.route_url(
                                "feature_attachment.page",
                                id=args.obj.id),
                            icon='material-attach_file')

    Resource.__dynmenu__.add(LayerMenuExt())
