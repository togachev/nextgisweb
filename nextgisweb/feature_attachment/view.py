from pyramid.httpexceptions import HTTPNotFound

from nextgisweb.env import gettext
from nextgisweb.lib import dynmenu as dm

from nextgisweb.feature_layer import IFeatureLayer
from nextgisweb.gui import react_renderer
from nextgisweb.jsrealm import icon
from nextgisweb.resource import DataScope, Resource, resource_factory


@react_renderer("@nextgisweb/feature-attachment/attachment-form")
def attachment(request):
    request.resource_permission(DataScope.read)

    if not request.context.has_export_permission(request.user):
        raise HTTPNotFound()

    return dict(
        obj=request.context,
        title=gettext("Manage attachments"),
        props=dict(id=request.context.id),
        maxheight=True,
    )


def setup_pyramid(comp, config):
    config.add_route(
        "feature_attachment.page",
        r"/resource/{id:uint}/attachments",
        factory=resource_factory,
    ).add_view(attachment, context=IFeatureLayer)

    icon_manage_attachments = icon("material/attach_file")

    # Layer menu extension
    @Resource.__dynmenu__.add
    def _resource_dynmenu(args):
        if not IFeatureLayer.providedBy(args.obj):
            return

        if args.obj.has_export_permission(args.request.user):
            if args.obj.cls != 'tablenogeom_layer':
                yield dm.Link(
                    "feature_layer/feature_attachment",
                    gettext("Manage attachments"),
                    lambda args: args.request.route_url("feature_attachment.page", id=args.obj.id),
                    icon=icon_manage_attachments,
                )
