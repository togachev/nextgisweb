from typing import Any
from msgspec import Struct
from osgeo import gdal, ogr, osr

from nextgisweb.env import DBSession, gettext
from nextgisweb.lib.geometry import Geometry, GeometryNotValid

from nextgisweb.core.exception import ValidationError
from nextgisweb.pyramid import JSONType
from nextgisweb.resource import DataScope, Resource, ResourceRef, ResourceScope
from nextgisweb.raster_layer.util import band_color_interp

from .interface import IFeatureLayer


class Point(Struct, kw_only=True):
    x: float
    y: float


class RasterLayerIdentifyItem(Struct, kw_only=True):
    resource: ResourceRef
    color_interpretation: list[str]
    pixel_class: list[str]
    values: list[Any]


class IdentifyBody(Struct, kw_only=True):
    geom: str
    srs: int
    styles: list[int]


class IModuleBody(Struct, kw_only=True):
    geom: str
    srs: int
    styles: list[object]
    status: bool
    point: list[float]


def identify(request, *, body: IdentifyBody) -> JSONType:
    """Find features intersecting geometry"""

    try:
        geom = Geometry.from_wkt(body.geom, srid=body.srs)
    except GeometryNotValid:
        raise ValidationError(gettext("Geometry is not valid."))

    # Number of features in all layers
    feature_count = 0

    query = DBSession.query(Resource).filter(Resource.id.in_(body.styles))
    result = dict()
    for style in query:
        layer = style.parent
        layer_id_str = str(style.id)
        if not layer.has_permission(DataScope.read, request.user):
            result[layer_id_str] = dict(error="Forbidden")

        elif not IFeatureLayer.providedBy(layer):
            result[layer_id_str] = dict(error="Not implemented")

        else:
            query = layer.feature_query()
            query.intersects(geom)

            # Limit number of identifiable features by 100 per layer,
            # otherwise the response might be too big.
            query.limit(100)

            features = [
                dict(
                    id=f.id,
                    layerId=layer.id,
                    styleId=style.id,
                    label=f.label,
                    fields=f.fields,
                    relation=dict(external_resource_id=layer.external_resource_id, relation_key=layer.external_field_name,relation_value=f.fields[layer.resource_field_name]) if layer.check_relation(layer) else None,
                )
                for f in query()
            ]

            # Add name of parent resource to identification results,
            # if there is no way to get layer name by id on the client
            allow = layer.parent.has_permission(ResourceScope.read, request.user)

            if allow:
                for feature in features:
                    feature["parent"] = style.parent.display_name

            result[layer_id_str] = dict(features=features, featureCount=len(features))

            feature_count += len(features)

    result["featureCount"] = feature_count

    return result

def imodule(request, *, body: IModuleBody) -> JSONType:

    try:
        geom = Geometry.from_wkt(body.geom, srid=body.srs)
    except GeometryNotValid:
        raise ValidationError(gettext("Geometry is not valid."))

    result = dict()
    query = DBSession.query(Resource).filter(Resource.id.in_([i["id"] for i in body.styles]))
    options = []

    for style in query:
        layer = style.parent

        if hasattr(layer, "feature_query"):
            if not layer.has_permission(DataScope.read, request.user):
                query = layer.feature_query()
                query.intersects(geom)
                query.limit(100)
                for f in query():
                    options.append(
                        dict(
                            desc=[x["label"] for x in body.styles if x["id"] == style.id][0],
                            id=f.id,
                            layerId=layer.id,
                            styleId=style.id,
                            dop=[x["dop"] for x in body.styles if x["id"] == style.id][0],
                            label="Forbidden",
                            permission="Forbidden",
                            value=str(style.id) + ":" + str(layer.id) + ":" + str(f.id),
                        )
                    )
            elif not IFeatureLayer.providedBy(layer):
                options.append(dict(value="Not implemented"))
            elif body.status == False:
                query = layer.feature_query()
                query.intersects(geom)
                query.limit(100)

                for f in query():
                    options.append(
                        dict(
                            desc=[x["label"] for x in body.styles if x["id"] == style.id][0],
                            id=f.id,
                            layerId=layer.id,
                            styleId=style.id,
                            dop=[x["dop"] for x in body.styles if x["id"] == style.id][0],
                            label=f.label,
                            permission="Read",
                            value=str(style.id) + ":" + str(layer.id) + ":" + str(f.id),
                            fields=None,
                            type="vector",
                            relation=None,
                        )
                    )
            else:
                query = layer.feature_query()
                query.intersects(geom)
                query.limit(100)

                for f in query():
                    options.append(
                        dict(
                            desc=[x["label"] for x in body.styles if x["id"] == style.id][0],
                            id=f.id,
                            layerId=layer.id,
                            styleId=style.id,
                            dop=[x["dop"] for x in body.styles if x["id"] == style.id][0],
                            label=f.label,
                            permission="Read",
                            value=str(style.id) + ":" + str(layer.id) + ":" + str(f.id),
                            fields=f.fields,
                            type="vector",
                            relation=dict(external_resource_id=layer.external_resource_id, relation_key=layer.external_field_name,relation_value=f.fields[layer.resource_field_name]) if layer.check_relation(layer) else None,
                        )
                    )

        if layer.cls == "raster_layer":
            ds = layer.gdal_dataset()
            attr = list()

            inSRef = ds.GetSpatialRef()
            outSRef = osr.SpatialReference()
            outSRef.ImportFromEPSG(4326)
            point = ogr.Geometry(ogr.wkbPoint)
            point.AssignSpatialReference(inSRef) 
            point.AddPoint(body.point[0], body.point[1])
            point.TransformTo(outSRef)

            if not layer.has_permission(DataScope.read, request.user):
                options.append(
                    dict(
                        desc=[x["label"] for x in body.styles if x["id"] == style.id][0],
                        layerId=layer.id,
                        styleId=style.id,
                        dop=[x["dop"] for x in body.styles if x["id"] == style.id][0],
                        label="Forbidden",
                        permission="Forbidden",
                        type="raster",
                        attr=None,
                        value=str(style.id) + ":" + str(layer.id) + ":" + str(round(point.GetY(), 12)) + ":" + str(round(point.GetX(), 12)),
                    )
                )
            else:
                if (values := val_at_coord(ds, body.point)) is None:
                    continue

                color_interpretation = []
                pixel_class = []

                for bidx in range(1, layer.band_count + 1):
                    band = ds.GetRasterBand(bidx)
                    color_interpretation.append(band_color_interp(band))
                    rat = band.GetDefaultRAT()
                    if (rat) is not None and rat.GetTableType() == gdal.GRTT_THEMATIC:
                        rat_col = rat.GetColOfUsage(gdal.GFU_Name)
                        rat_row = rat.GetRowOfValue(values[bidx - 1].item())
                        if rat_col == -1 or rat_row == -1:
                            pixel_class.append(None)
                            continue
                        pixel_class_value = rat.GetValueAsString(rat_row, rat_col)
                        pixel_class.append(pixel_class_value)
                    else:
                        pixel_class.append(None)

                value_channel = ["{} ({:02})".format(b_, a_) for a_, b_ in zip(color_interpretation, values.flatten().tolist())]

                for i, value in enumerate(value_channel):
                    attr.append(dict(key=i, attr=i, value=value, datatype="STRING", format_field=dict()))

                options.append(
                    dict(
                        desc=[x["label"] for x in body.styles if x["id"] == style.id][0],
                        layerId=layer.id,
                        styleId=style.id,
                        dop=[x["dop"] for x in body.styles if x["id"] == style.id][0],
                        label=[x["label"] for x in body.styles if x["id"] == style.id][0],
                        permission="Read",
                        type="raster",
                        attr=attr,
                        value=str(style.id) + ":" + str(layer.id) + ":" + str(round(point.GetY(), 12)) + ":" + str(round(point.GetX(), 12)),
                    )
                )

    result["data"] = options
    result["featureCount"] = len(options)
    
    return result

def val_at_coord(ds: gdal.Dataset, point: Point):
    """Simplified version of gdallocationinfo with less options. Borrowed from
    https://github.com/OSGeo/gdal/blob/master/swig/python/gdal-utils/osgeo_utils/samples/gdallocationinfo.py
    """

    # Read geotransform matrix and calculate corresponding pixel coordinates
    geotransform = ds.GetGeoTransform()
    inv_geotransform = gdal.InvGeoTransform(geotransform)
    i = int(inv_geotransform[0] + inv_geotransform[1] * point[0] + inv_geotransform[2] * point[1])
    j = int(inv_geotransform[3] + inv_geotransform[4] * point[0] + inv_geotransform[5] * point[1])

    if i < 0 or i >= ds.RasterXSize or j < 0 or j >= ds.RasterYSize:
        return None

    result = ds.ReadAsArray(i, j, 1, 1)
    return result


def setup_pyramid(comp, config):
    config.add_route(
        "feature_layer.identify",
        "/api/feature_layer/identify",
        post=identify,
    )

    config.add_route(
        "feature_layer.imodule",
        "/api/feature_layer/imodule",
        post=imodule,
    )