from collections import namedtuple
from inspect import signature
from urllib.parse import unquote, urljoin, urlparse

from pyramid.renderers import render_to_response

from nextgisweb.env import gettext
from nextgisweb.lib.dynmenu import Label, Link

from nextgisweb.pyramid import viewargs
from nextgisweb.render import IRenderableScaleRange
from nextgisweb.render.api import legend_symbols_by_resource
from nextgisweb.render.legend import ILegendSymbols
from nextgisweb.render.util import scale_range_intersection
from nextgisweb.render.view import TMSLink
from nextgisweb.resource import DataScope, Resource, ResourceFactory, ResourceScope, Widget

from .adapter import WebMapAdapter
from .model import LegendSymbolsEnum, WebMap, WebMapScope
from .plugin import WebmapLayerPlugin, WebmapPlugin
from .util import webmap_items_to_tms_ids_list

from nextgisweb.env import DBSession
from nextgisweb.resource.model import ResourceWebMapGroup, WebMapGroupResource

class ItemWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = "@nextgisweb/webmap/items-widget"


class SettingsWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = "@nextgisweb/webmap/settings-widget"


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


@viewargs(renderer="mako")
def display(obj, request):
    is_valid_or_error = check_origin(request)
    if is_valid_or_error is not True:
        return is_valid_or_error

    request.resource_permission(ResourceScope.read)

    MID = namedtuple("MID", ["adapter", "basemap", "plugin"])

    display.mid = MID(
        set(),
        set(),
        set(),
    )

    # Map level plugins
    plugin = dict()
    for pcls in WebmapPlugin.registry:
        p_mid_data = pcls.is_supported(obj)
        if p_mid_data:
            plugin.update((p_mid_data,))

    items_states = {
        "expanded": [],
        "checked": [],
    }

    ls_webmap = request.env.webmap.effective_legend_symbols() + obj.legend_symbols

    def _legend(layer, style):
        ls_layer = ls_webmap + obj.legend_symbols + layer.legend_symbols
        result = dict(visible=ls_layer)
        if ls_layer in (LegendSymbolsEnum.EXPAND, LegendSymbolsEnum.COLLAPSE):
            has_legend = result["has_legend"] = ILegendSymbols.providedBy(style)
            if has_legend:
                legend_symbols = legend_symbols_by_resource(style, 20, request.translate)
                result.update(symbols=legend_symbols)
                is_single = len(legend_symbols) == 1
                result.update(single=is_single)
                if not is_single:
                    result.update(open=ls_layer == LegendSymbolsEnum.EXPAND)

        return result

    def traverse(item):
        data = dict(
            id=item.id,
            key=item.id,
            type=item.item_type,
            label=item.display_name,
            title=item.display_name,
        )

        if item.item_type == "layer":
            style = item.style
            layer = style.parent if style.cls.endswith("_style") else style

            if not style.has_permission(DataScope.read, request.user):
                return None

            # If there are no necessary permissions skip web-map element
            # so it won't be shown in the tree

            # TODO: Security

            # if not layer.has_permission(
            #     request.user,
            #     'style-read',
            #     'data-read',
            # ):
            #     return None

            layer_enabled = bool(item.layer_enabled)
            if layer_enabled:
                items_states.get("checked").append(item.id)

            scale_range = item.scale_range()
            if IRenderableScaleRange.providedBy(style):
                scale_range = scale_range_intersection(scale_range, style.scale_range())

            # Main element parameters
            data.update(
                layerId=style.parent_id,
                styleId=style.id,
                cls=style.cls,
                layerCls=layer.cls,
                visibility=layer_enabled,
                identifiable=item.layer_identifiable,
                transparency=item.layer_transparency,
                minScaleDenom=scale_range[0],
                maxScaleDenom=scale_range[1],
                drawOrderPosition=item.draw_order_position,
                legendInfo=_legend(item, style),
            )

            if item.file_resource_visible:
                data.update(
                    fileResourceVisible=item.file_resource_visible, # Прикрепленные файлы (показать/скрыть)
                )

            if layer.check_relation(layer):
                data.update(
                    relation=layer.check_relation(layer)
                )

            data["adapter"] = WebMapAdapter.registry.get(item.layer_adapter, "image").mid
            display.mid.adapter.add(data["adapter"])

            # Layer level plugins
            plugin = dict()
            plugin_base_kwargs = dict(layer=layer, webmap=obj)
            for pcls in WebmapLayerPlugin.registry:
                fn = pcls.is_layer_supported
                plugin_kwargs = (
                    dict(plugin_base_kwargs, style=style)
                    if "style" in signature(fn).parameters
                    else plugin_base_kwargs
                )
                p_mid_data = fn(**plugin_kwargs)
                if p_mid_data:
                    plugin.update((p_mid_data,))

            data.update(plugin=plugin)
            display.mid.plugin.update(plugin.keys())

        elif item.item_type in ("root", "group"):
            expanded = item.group_expanded
            exclusive = item.group_exclusive
            if expanded:
                items_states.get("expanded").append(item.id)
            # Recursively run all elements excluding those
            # with no permissions
            data.update(
                expanded=expanded,
                exclusive=exclusive,
                children=list(filter(None, map(traverse, item.children))),
            )
            # Hide empty groups
            if (item.item_type in "group") and not data["children"]:
                return None

        return data

    title = obj.display_name if obj.title is None else obj.title

    def get_relation(item):
        list = []
        def traverse_relation(item):
            if item.item_type in ("root", "group"):
                if item.children:
                    for child in item.children:
                        traverse_relation(child) # Traverse child nodes.
            elif item.item_type == "layer":
                layer=item.style.parent
                if not layer.has_permission(DataScope.read, request.user):
                    return None
                if layer.check_relation(layer):
                    list.append(layer.check_relation(layer))

        traverse_relation(item)
        return list if len(list) > 0 else None

    tmp = obj.to_dict()
    display_config = dict(
        extent=tmp["extent"],
        extent_const=tmp["extent_const"],
        rootItem=traverse(obj.root_item),
        itemsStates=items_states,
        active_panel=obj.active_panel,
        infomap=dict(
            resource=request.route_url("resource.show", id=0),
            link=request.route_url("resource.show", id=obj.id),
            update=request.route_url("resource.update", id=obj.id),
            scope=obj.has_permission(ResourceScope.update, request.user)
        ),
        mid=dict(
            adapter=tuple(display.mid.adapter),
            basemap=tuple(display.mid.basemap),
            plugin=tuple(display.mid.plugin),
        ),
        webmapPlugin=plugin,
        bookmarkLayerId=obj.bookmark_resource_id,
        webmapId=obj.id,
        webmapDescription=obj.description,
        webmapTitle=title,
        webmapEditable=obj.editable,
        webmapLegendVisible=obj.legend_symbols,
        drawOrderEnabled=obj.draw_order_enabled,
        measureSrsId=obj.measure_srs_id,
        printMaxSize=request.env.webmap.options["print.max_size"],
    )

    if request.env.webmap.options["annotation"]:
        display_config["annotations"] = dict(
            enabled=obj.annotation_enabled,
            default=obj.annotation_default,
            scope=dict(
                read=obj.has_permission(WebMapScope.annotation_read, request.user),
                write=obj.has_permission(WebMapScope.annotation_write, request.user),
                manage=obj.has_permission(WebMapScope.annotation_manage, request.user),
            ),
        )

    return dict(obj=obj, title=title, display_config=display_config, custom_layout=True)


@viewargs(renderer="mako")
def display_tiny(obj, request):
    return display(obj, request)


@viewargs(renderer="react")
def clone(request):
    request.resource_permission(ResourceScope.read)
    return dict(
        entrypoint="@nextgisweb/webmap/clone-webmap",
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


@viewargs(renderer="react")
def settings(request):
    request.require_administrator()
    return dict(
        entrypoint="@nextgisweb/webmap/settings",
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
                icon="webmap-display",
            )

        if args.obj.has_permission(ResourceScope.read, args.request.user):
            yield Link(
                "webmap/clone",
                gettext("Clone"),
                lambda args: args.request.route_url("webmap.clone", id=args.obj.id),
                important=False,
                target="_self",
                icon="material-content_copy",
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
