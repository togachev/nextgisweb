from nextgisweb.env import DBSession
from nextgisweb.lib.geometry import Geometry
from nextgisweb.pyramid import JSONType
from nextgisweb.resource import DataStructureScope, Resource, ResourceScope

from .interface import IFeatureLayer
from .api import serialize

def identify(request) -> JSONType:
    data = request.json_body
    srs = int(data["srs"])
    geom = Geometry.from_wkt(data["geom"], srid=srs)
    styles = map(int, data["styles"])
    style_list = DBSession.query(Resource).filter(Resource.id.in_(styles))
    result = dict()

    # Number of features in all layers
    feature_count = 0

    for style in style_list:
        layer = style.parent
        layer_id_str = str(layer.id)
        if not layer.has_permission(DataStructureScope.read, request.user):
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
                )
                for f in query()
            ]

            # Add name of parent resource to identification results,
            # if there is no way to get layer name by id on the client
            allow = layer.parent.has_permission(ResourceScope.read, request.user)

            if allow:
                for feature in features:
                    feature["parent"] = layer.parent.display_name

            result[layer_id_str] = dict(features=features, featureCount=len(features))

            feature_count += len(features)

    result["featureCount"] = feature_count

    return result

def query_feature_intersects(query, geom):
    if geom is not None:
        query.intersects(geom)
        for feat in query():
            return feat

def identify_layer(request) -> JSONType:
    data = request.json_body
    srs = int(data["srs"])
    geom = Geometry.from_wkt(data["geom"], srid=srs)
    styles = map(int, data["styles"])
    result = []
    style_list = DBSession.query(Resource).filter(Resource.id.in_(styles))
    
    for style in style_list:
        layer = style.parent
        srs = request.GET.get("srs")

        srlz_params = dict(
            geom_format=request.GET.get("geom_format", "wkt").lower(),
        )

        query = layer.feature_query()
        query.geom()

        feature = query_feature_intersects(query, geom)

        if feature is not None:
            items = dict(
                serialize(feature, **srlz_params),
                column_from_const=layer.column_from_const,
                column_key=layer.column_key,
                column_constraint=layer.column_constraint
            )
            result.append(items)

    return result

def identify_module(request) -> JSONType:
    data = request.json_body
    srs = int(data["srs"])
    geom = Geometry.from_wkt(data["geom"], srid=srs)
    result = dict()
    style_list = DBSession.query(Resource).filter(Resource.id.in_([i["id"] for i in data["styles"]]))
    options = []
    for style in style_list:
        layer = style.parent
        if not layer.has_permission(DataStructureScope.read, request.user):
            query = layer.feature_query()
            query.geom()
            query.intersects(geom)
            query.limit(100)
            for f in query():
                options.append(
                    dict(
                        desc=[x["label"] for x in data["styles"] if x["id"] == style.id][0],
                        id=f.id,
                        layerId=layer.id,
                        styleId=style.id,
                        dop=[x["dop"] for x in data["styles"] if x["id"] == style.id][0],
                        label="Forbidden",
                        value=str(style.id) + ":" + str(layer.id) + ":" + str(f.id),
                    )
                )
        elif not IFeatureLayer.providedBy(layer):
            options.append(dict(value="Not implemented"))
        else:
            query = layer.feature_query()
            query.geom()
            query.intersects(geom)
            query.limit(100)

            for f in query():
                options.append(
                    dict(
                        desc=[x["label"] for x in data["styles"] if x["id"] == style.id][0],
                        id=f.id,
                        layerId=layer.id,
                        styleId=style.id,
                        dop=[x["dop"] for x in data["styles"] if x["id"] == style.id][0],
                        label=f.label,
                        value=str(style.id) + ":" + str(layer.id) + ":" + str(f.id),
                    )
                )

    result["data"] = options
    result["featureCount"] = len(options)
    return result

def feature_selected(request) -> JSONType:
    data = request.json_body
    options = []
    for p in data:
        layerId = int(p["layerId"])
        styleId = int(p["styleId"])
        featureId = int(p["featureId"])
        dop = int(p["dop"])
        layer = Resource.filter_by(id=layerId).one()
        result = dict()
        if not layer.has_permission(DataStructureScope.read, request.user):
            query = layer.feature_query()
            for f in query():
                if f.id == featureId:
                    result["data"] = dict(
                        desc=layer.parent.display_name if p["label"] is None else p["label"],
                        id=f.id,
                        layerId=layerId,
                        styleId=styleId,
                        dop=dop,
                        label="Forbidden",
                        value=str(styleId) + ":" + str(layerId) + ":" + str(f.id),
                    )
        elif not IFeatureLayer.providedBy(layer):
            result["data"] = dict(value="Not implemented")
        else:
            query = layer.feature_query()
            for f in query():
                if f.id == featureId:
                    result["data"] = dict(
                        desc=layer.parent.display_name if p["label"] is None else p["label"],
                        id=f.id,
                        layerId=layerId,
                        styleId=styleId,
                        dop=dop,
                        label=f.label,
                        value=str(styleId) + ":" + str(layerId) + ":" + str(f.id),
                    )
        options.append(result["data"])
    return options

def setup_pyramid(comp, config):
    config.add_route(
        "feature_layer.identify",
        "/api/feature_layer/identify",
        post=identify,
    )

    config.add_route(
        "feature_layer.identify_layer",
        "/api/feature_layer/identify_layer",
        post=identify_layer,
    )

    config.add_route(
        "feature_layer.identify_module",
        "/api/feature_layer/identify_module",
        post=identify_module,
    )

    config.add_route(
        "feature_layer.feature_selected",
        "/api/feature_layer/feature_selected",
        post=feature_selected,
    )