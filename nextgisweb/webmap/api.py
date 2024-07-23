from pathlib import Path
from shutil import which
from subprocess import check_call
from tempfile import TemporaryDirectory
from typing import List, Literal, Optional, Union

from geoalchemy2.shape import to_shape
from msgspec import UNSET, Meta, Struct, UnsetType
from pyramid.httpexceptions import HTTPNotFound
from pyramid.renderers import render
from pyramid.response import Response
from typing_extensions import Annotated

from nextgisweb.env import DBSession

from nextgisweb.jsrealm import TSExport
from nextgisweb.layer import IBboxLayer
from nextgisweb.pyramid import JSONType
from nextgisweb.pyramid.api import csetting
from nextgisweb.resource import DataScope, Resource, ResourceFactory, ResourceScope, resource_factory

from .model import WebMap, WebMapAnnotation, WebMapScope, WebMapItem

AnnotationID = Annotated[int, Meta(ge=1, description="Annotation ID")]


def annotation_to_dict(obj, request, with_user_info=False):
    result = dict()

    keys = ("id", "description", "style", "geom", "public")
    if with_user_info and (obj.public is False):
        keys = keys + (
            "user_id",
            "user",
        )

    user_id = request.user.id
    result["own"] = user_id == obj.user_id

    for k in keys:
        v = getattr(obj, k)
        if k == "geom":
            v = to_shape(v).wkt
        if k == "user" and (v is not None):
            v = v.display_name
        if v is not None:
            result[k] = v
    return result


def annotation_from_dict(obj, data):
    for k in ("description", "style", "geom", "public"):
        if k in data:
            v = data[k]
            if k == "geom":
                v = "SRID=3857;" + v
            setattr(obj, k, v)


def check_annotation_enabled(request):
    if not request.env.webmap.options["annotation"]:
        raise HTTPNotFound()


def annotation_cget(resource, request) -> JSONType:
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_read)

    if resource.has_permission(WebMapScope.annotation_manage, request.user):
        return [annotation_to_dict(a, request, with_user_info=True) for a in resource.annotations]

    return [
        annotation_to_dict(a, request)
        for a in resource.annotations
        if a.public or (not a.public and a.user_id == request.user.id)
    ]


def annotation_cpost(resource, request) -> JSONType:
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_write)
    obj = WebMapAnnotation()
    annotation_from_dict(obj, request.json_body)
    if not obj.public:
        obj.user_id = request.user.id
    resource.annotations.append(obj)
    DBSession.flush()
    return dict(id=obj.id)


def annotation_iget(resource, request) -> JSONType:
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_read)
    obj = WebMapAnnotation.filter_by(
        webmap_id=resource.id, id=int(request.matchdict["annotation_id"])
    ).one()
    with_user_info = resource.has_permission(WebMapScope.annotation_manage, request.user)
    return annotation_to_dict(obj, request, with_user_info)


def annotation_iput(resource, request) -> JSONType:
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_write)
    obj = WebMapAnnotation.filter_by(
        webmap_id=resource.id, id=int(request.matchdict["annotation_id"])
    ).one()
    annotation_from_dict(obj, request.json_body)
    return dict(id=obj.id)


def annotation_idelete(resource, request) -> JSONType:
    check_annotation_enabled(request)
    request.resource_permission(WebMapScope.annotation_write)
    obj = WebMapAnnotation.filter_by(
        webmap_id=resource.id, id=int(request.matchdict["annotation_id"])
    ).one()
    DBSession.delete(obj)
    return None


def add_extent(e1, e2):
    def is_valid(extent):
        if not extent:
            return False
        for k, v in extent.items():
            if v is None:
                return False
        return True

    e1_valid = is_valid(e1)
    e2_valid = is_valid(e2)
    if (not e1_valid) or (not e2_valid):
        return (e2 if e2_valid else None) or (e1 if e1_valid else None)

    return dict(
        minLon=min(e1["minLon"], e2["minLon"]),
        maxLon=max(e1["maxLon"], e2["maxLon"]),
        minLat=min(e1["minLat"], e2["minLat"]),
        maxLat=max(e1["maxLat"], e2["maxLat"]),
    )


def get_webmap_extent(resource, request) -> JSONType:
    request.resource_permission(WebMapScope.display)

    def traverse(item, extent):
        if item.item_type == "layer":
            if res := item.style.lookup_interface(IBboxLayer):
                if not res.has_permission(DataScope.read, request.user):
                    return extent
                extent = add_extent(extent, res.extent)
        elif item.item_type in ("root", "group"):
            for i in item.children:
                extent = traverse(i, extent)
        return extent

    return traverse(resource.root_item, None)


PrintFormat = Annotated[Literal["png", "jpeg", "tiff", "pdf"], TSExport("PrintFormat")]


class ElementSize(Struct):
    x: Annotated[float, Meta()]
    y: Annotated[float, Meta()]
    width: Annotated[float, Meta(gt=0)]
    height: Annotated[float, Meta(gt=0)]


class ElementContent(ElementSize):
    content: str


class LegendTreeNode(Struct):
    title: str
    isGroup: bool
    isLegend: bool
    children: List["LegendTreeNode"]
    icon: Union[str, UnsetType] = UNSET


class LegendElement(ElementSize):
    legendColumns: Annotated[int, Meta()]
    legendItems: Union[List[LegendTreeNode], UnsetType] = UNSET


class MapContent(ElementSize):
    content: bytes


class PrintBody(Struct):
    width: Annotated[float, Meta(gt=0, le=500)]
    height: Annotated[float, Meta(gt=0, le=500)]
    margin: Annotated[float, Meta(ge=0, le=100)]
    map: MapContent
    format: PrintFormat
    legend: Union[LegendElement, UnsetType] = UNSET
    title: Union[ElementContent, UnsetType] = UNSET


class LegendViewModel(Struct):
    title: str
    level: int
    group: bool
    legend: bool
    icon: Union[str, UnsetType] = UNSET


def to_legend_view_model(legend_node: LegendTreeNode, level: int) -> LegendViewModel:
    if legend_node.isLegend:
        level = level - 1
    return LegendViewModel(
        title=legend_node.title,
        level=level,
        group=legend_node.isGroup,
        legend=legend_node.isLegend,
        icon=legend_node.icon,
    )


def handle_legend_node(
    node: LegendTreeNode, level: int, legend_tree: List[LegendViewModel]
) -> None:
    legend_tree.append(to_legend_view_model(node, level))
    for child in node.children:
        handle_legend_node(child, level + 1, legend_tree)


def handle_legend_tree(nodes: List[LegendTreeNode]) -> List[LegendViewModel]:
    legend_tree: List[LegendViewModel] = []
    for node in nodes:
        handle_legend_node(node, 0, legend_tree)
    return legend_tree


def print(request, *, body: PrintBody) -> Response:
    with TemporaryDirectory() as temp_name:
        temp_dir = Path(temp_name)

        map_image_file = temp_dir / "img.png"
        map_image_file.write_bytes(body.map.content)

        legend = body.legend
        legend_info = None
        if legend is not None:
            legend_info = handle_legend_tree(legend.legendItems)
            if not legend.legendColumns:
                legend.legendColumns = 1

        index_html = temp_dir / "index.html"
        index_html.write_text(
            render(
                "template/print.mako",
                {
                    "width": int(body.width),
                    "height": int(body.height),
                    "margin": int(body.margin),
                    "map": body.map,
                    "map_image": map_image_file.relative_to(temp_dir),
                    "legend": legend,
                    "legend_info": legend_info,
                    "title": body.title,
                },
                request,
            )
        )

        output_pdf = temp_dir / "output.pdf"
        check_call(
            [
                "chromium-browser",
                "--headless",
                "--no-sandbox",
                "--disable-gpu",
                "--run-all-compositor-stages-before-draw",
                "--virtual-time-budget=10000",
                "--no-pdf-header-footer",
                f"--print-to-pdf={output_pdf}",
                f"{index_html}",
            ]
        )

        output_file = None
        content_type = None
        if body.format == "pdf":
            output_file = output_pdf
            content_type = "application/pdf"
        else:
            content_type, output_file = pdf_to_image(body.format, output_pdf, temp_dir)

        return Response(
            app_iter=output_file.open("rb"),
            content_type=content_type,
            request=request,
        )


def pdf_to_image(format: PrintFormat, pdf_file: str, temp_dir: TemporaryDirectory):
    gs = which("gs")
    if not gs:
        raise RuntimeError("Ghostscript not found")

    output_file = None
    content_type = None
    device = None

    if format == "jpeg":
        content_type = "image/jpeg"
        output_file = temp_dir / "output.jpeg"
        device = "jpeg"
    elif format == "png":
        content_type = "image/png"
        output_file = temp_dir / "output.png"
        device = "png16m"
    elif format == "tiff":
        content_type = "image/tiff"
        output_file = temp_dir / "output.tiff"
        device = "tiff24nc"
    else:
        raise ValueError(f"Wrong image fromat to export: {format}")

    check_call(
        [
            gs,
            "-q",
            "-dBATCH",
            "-dSAFER",
            "-dNOPAUSE",
            "-r96",
            "-dDownScaleFactor=1",
            f"-sDEVICE={device}",
            f"-sOutputFile={output_file}",
            pdf_file,
        ]
    )

    return (content_type, output_file)


# Component settings

LengthUnits = Annotated[
    Literal["m", "km", "metric", "ft", "mi", "imperial"], TSExport("LengthUnits")
]
AreaUnits = Annotated[
    Literal["sq_m", "sq_km", "metric", "ha", "ac", "sq_mi", "imperial", "sq_ft"],
    TSExport("AreaUnits"),
]
DegreeFormat = Annotated[Literal["dd", "ddm", "dms"], TSExport("DegreeFormat")]
AddressGeocoder = Annotated[Literal["nominatim", "yandex"], TSExport("DegreeFormat")]

csetting("identify_radius", float, default=3)
csetting("identify_attributes", bool, default=True)
csetting("show_geometry_info", bool, default=False)
csetting("popup_width", int, default=300)
csetting("popup_height", int, default=200)
csetting("address_search_enabled", bool, default=True)
csetting("address_search_extent", bool, default=False)
csetting("address_geocoder", AddressGeocoder, default="nominatim")
csetting("yandex_api_geocoder_key", Optional[str], default=None)
csetting("nominatim_countrycodes", Optional[str], default=None)
csetting("units_length", LengthUnits, default="m")
csetting("units_area", AreaUnits, default="sq_m")
csetting("degree_format", DegreeFormat, default="dd")
csetting("measurement_srid", int, default=4326)
csetting("legend_symbols", Optional[str], default=None)
csetting("hide_nav_menu", bool, default=False)
csetting("max_count_file_upload", float, default=10)
csetting("idetify_module", bool, default=False)
csetting("offset_point", int, default=10)


def webmap_item_update(resource, request) -> JSONType:
    # request.resource_permission(ResourceScope.update)
    parent_id = int(request.matchdict["parent_id"])
    layer_style_id = int(request.matchdict["layer_style_id"])
    draw_order_position = int(request.matchdict["draw_order_position"])
    def update(parent_id, layer_style_id, draw_order_position):
        item = DBSession.query(WebMapItem).filter(WebMapItem.parent_id == parent_id, WebMapItem.layer_style_id == layer_style_id).one()
        item.draw_order_position = draw_order_position

    with DBSession.no_autoflush:
        update(parent_id, layer_style_id, draw_order_position)
    DBSession.flush()
    return(dict(layer_style_id=layer_style_id, draw_order_position=draw_order_position))

def setup_pyramid(comp, config):
    webmap_factory = ResourceFactory(context=WebMap)

    config.add_route(
        "webmap.item.update",
        "/api/webmap/item/{parent_id:uint}/{layer_style_id:uint}/{draw_order_position:uint}/update",
        # factory=resource_factory,
        get=webmap_item_update,
    )

    config.add_route(
        "webmap.annotation.collection",
        "/api/resource/{id}/annotation/",
        factory=webmap_factory,
        get=annotation_cget,
        post=annotation_cpost,
    )

    config.add_route(
        "webmap.annotation.item",
        "/api/resource/{id}/annotation/{annotation_id}",
        factory=webmap_factory,
        types=dict(annotation_id=AnnotationID),
        get=annotation_iget,
        put=annotation_iput,
        delete=annotation_idelete,
    )

    config.add_route(
        "webmap.extent",
        "/api/resource/{id}/webmap/extent",
        factory=webmap_factory,
        get=get_webmap_extent,
    )

    config.add_route(
        "webmap.print",
        "/api/component/{id}/webmap/print",
        factory=webmap_factory,
        post=print,
    )
