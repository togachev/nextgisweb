from urllib.parse import unquote, urljoin, urlparse

from pyramid.renderers import render_to_response

from nextgisweb.env import gettext
from nextgisweb.lib.dynmenu import Label, Link

from nextgisweb.gui import react_renderer
from nextgisweb.jsrealm import icon, jsentry
from nextgisweb.pyramid import viewargs
from nextgisweb.render.view import TMSLink
from nextgisweb.resource import Resource, ResourceFactory, ResourceScope, Widget

from .model import WebMap
from .util import webmap_items_to_tms_ids_list

from nextgisweb.env import DBSession
from nextgisweb.resource.model import ResourceWebMapGroup, WebMapGroupResource

class ItemWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/webmap/items-widget")


class SettingsWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/webmap/settings-widget")


def check_origin(request):
    if (
        not request.env.webmap.options["check_origin"]
        or request.headers.get("Sec-Fetch-Dest") != "iframe"
        or request.headers.get("Sec-Fetch-Site") == "same-origin"
    ):
        return True

    referer = request.headers.get("Referer")
    if referer is not None:
        if referer.endswith("/"):
            referer = referer[:-1]
        if not referer.startswith(request.application_url) and not request.check_origin(referer):
            webmap_url = (
                request.route_url("webmap.display", id=request.context.id)
                + "?"
                + request.query_string
            )

            response = render_to_response(
                "nextgisweb:webmap/template/invalid_origin.mako",
                dict(
                    origin=urljoin(request.headers.get("Referer"), "/"),
                    domain=urlparse(request.application_url).hostname,
                    webmap_url=webmap_url,
                ),
                request,
            )
            response.status = 403
            return response

    return True


def display_view(obj, request, *, entrypoint):
    is_valid_or_error = check_origin(request)
    if is_valid_or_error is not True:
        return is_valid_or_error

    request.resource_permission(ResourceScope.read)

    title = obj.display_name if obj.title is None else obj.title
    return dict(
        entrypoint=entrypoint,
        obj=obj,
        title=title,
        custom_layout=True,
    )


DISPLAY_JSENTRY = jsentry("@nextgisweb/webmap/display/DisplayWidget")
DISPLAY_TINY_JSENTRY = jsentry("@nextgisweb/webmap/display-tiny")


@viewargs(renderer="mako")
def display(obj, request):
    return display_view(
        *(obj, request),
        entrypoint=DISPLAY_JSENTRY,
    )


@viewargs(renderer="mako")
def display_tiny(obj, request):
    return display_view(
        *(obj, request),
        entrypoint=DISPLAY_TINY_JSENTRY,
    )


@react_renderer("@nextgisweb/webmap/clone-webmap")
def clone(request):
    request.resource_permission(ResourceScope.read)
    return dict(
        props=dict(id=request.context.id),
        obj=request.context,
        title=gettext("Clone web map"),
    )


@viewargs(renderer="mako")
def preview_embedded(request):
    iframe = None
    if "iframe" in request.POST:
        iframe = unquote(unquote(request.POST["iframe"]))
        request.response.headerlist.append(("X-XSS-Protection", "0"))

    return dict(
        iframe=iframe,
        title=gettext("Embedded webmap preview"),
        limit_width=False,
    )


@react_renderer("@nextgisweb/webmap/settings")
def settings(request):
    request.require_administrator()
    return dict(
        title=gettext("Web map settings"),
        dynmenu=request.env.pyramid.control_panel,
    )

@viewargs(renderer="react")
def wmg_settings(request):
    request.resource_permission(ResourceScope.update)
    rwg = DBSession.query(ResourceWebMapGroup)
    wgr = DBSession.query(WebMapGroupResource).filter(WebMapGroupResource.resource_id == request.context.id)

    result_rwg = list() # список групп
    result_wgr = list() # установленные группы для цифровых карт
    for resource_wmg in rwg:
        result_rwg.append(dict(id=resource_wmg.id, webmap_group_name=resource_wmg.webmap_group_name, action_map=resource_wmg.action_map))

    for wmg_resource in wgr:
        result_wgr.append(dict(id=wmg_resource.webmap_group_id))

    return dict(
        entrypoint="@nextgisweb/webmap/wmg-settings",
        props=dict(id=request.context.id, wmgroup=result_rwg, group=result_wgr),
        obj=request.context,
        title=gettext("Setting up a web map group"))

class WebMapTMSLink(TMSLink):
    resource = WebMap
    interface = None

    @classmethod
    def url_factory(cls, obj, request) -> str:
        rids = ",".join(map(str, webmap_items_to_tms_ids_list(obj)))
        return request.route_url("render.tile") + "?resource=" + rids + "&nd=204&z={z}&x={x}&y={y}"


def setup_pyramid(comp, config):
    resource_factory = ResourceFactory(context=WebMap)

    config.add_route(
        "webmap.display",
        r"/resource/{id:uint}/display",
        factory=resource_factory,
        get=display,
    )

    config.add_route(
        "webmap.display.tiny",
        r"/resource/{id:uint}/display/tiny",
        factory=resource_factory,
        get=display_tiny,
    )

    config.add_route(
        "webmap.clone",
        r"/resource/{id:uint}/clone",
        factory=resource_factory,
        get=clone,
    )

    config.add_route(
        "webmap.preview_embedded",
        "/webmap/embedded-preview",
        get=preview_embedded,
        post=preview_embedded,
    )

    config.add_route(
        "webmap.control_panel.settings",
        "/control-panel/webmap-settings",
        get=settings,
    )

    config.add_route(
        "wmgroup.settings",
        r"/wmgroup/{id:uint}/settings",
        factory=resource_factory,
    ).add_view(wmg_settings, context=WebMap)

    icon_display = icon("display")
    icon_clone = icon("material/content_copy")

    @Resource.__dynmenu__.add
    def _resource_dynmenu(args):
        if not isinstance(args.obj, WebMap):
            return

        yield Label("webmap", gettext("Web map"))

        if args.obj.has_permission(ResourceScope.read, args.request.user):
            yield Link(
                "webmap/display",
                gettext("Display"),
                lambda args: args.request.route_url("webmap.display", id=args.obj.id),
                important=True,
                target="_blank",
                icon=icon_display,
            )

        if args.obj.has_permission(ResourceScope.read, args.request.user):
            yield Link(
                "webmap/clone",
                gettext("Clone"),
                lambda args: args.request.route_url("webmap.clone", id=args.obj.id),
                important=False,
                target="_self",
                icon=icon_clone,
            )
        if args.obj.has_permission(ResourceScope.update, args.request.user):
            yield Link(
                "wmgroup/settings",
                gettext("Group setting"),
                lambda args: args.request.route_url("wmgroup.settings", id=args.obj.id),
                important=False,
                target="_self",
                icon="material-edit",
            )
    @comp.env.pyramid.control_panel.add
    def _control_panel(args):
        if args.request.user.is_administrator:
            yield Link(
                "settings.webmap",
                gettext("Web map"),
                lambda args: (args.request.route_url("webmap.control_panel.settings")),
            )
