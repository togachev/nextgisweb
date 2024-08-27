from nextgisweb.env import DBSession
from nextgisweb.lib.geometry import Geometry

from nextgisweb.pyramid import JSONType
from nextgisweb.resource import DataScope, Resource, ResourceScope

from .interface import IFeatureLayer

def identify(request) -> JSONType:
    data = request.json_body
    srs = int(data["srs"])
    geom = Geometry.from_wkt(data["geom"], srid=srs)
    layers = map(int, data["layers"])

    layer_list = DBSession.query(Resource).filter(Resource.id.in_(layers))

    result = dict()

    # Number of features in all layers
    feature_count = 0

    for layer in layer_list:
        layer_id_str = str(layer.id)
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

            if layer.check_relation(layer):
                for feature in features:
                    feature["relation"] = dict(
                        external_resource_id=layer.external_resource_id,
                        relation_key=layer.external_field_name,
                        relation_value=feature["fields"][layer.resource_field_name]
                    )

            result[layer_id_str] = dict(features=features, featureCount=len(features))

            feature_count += len(features)

    result["featureCount"] = feature_count

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
        if not layer.has_permission(DataScope.read, request.user):
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
                        permission="Forbidden",
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
                        permission="Read",
                        value=str(style.id) + ":" + str(layer.id) + ":" + str(f.id),
                        fields=f.fields,
                    )
                )

            if layer.check_relation(layer):
                for feature in options:
                    feature["relation"] = dict(
                        external_resource_id=layer.external_resource_id,
                        relation_key=layer.external_field_name,
                        relation_value=feature["fields"][layer.resource_field_name]
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
        dop = int(p["dop"]) if p.get("dop") is not None else -1
        layer = Resource.filter_by(id=layerId).one()
        result = dict()
        if not layer.has_permission(DataScope.read, request.user):
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
                        permission="Forbidden",
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
                        permission="Read",
                        value=str(styleId) + ":" + str(layerId) + ":" + str(f.id),
                        fields=f.fields,
                    )
            if layer.check_relation(layer):
                result["data"]["relation"] = dict(
                    external_resource_id=layer.external_resource_id,
                    relation_key=layer.external_field_name,
                    relation_value=result["data"]["fields"][layer.resource_field_name]
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
        "feature_layer.identify_module",
        "/api/feature_layer/identify_module",
        post=identify_module,
    )

    config.add_route(
        "feature_layer.feature_selected",
        "/api/feature_layer/feature_selected",
        post=feature_selected,
    )