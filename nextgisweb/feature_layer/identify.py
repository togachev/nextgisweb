from nextgisweb.env import DBSession, _
from nextgisweb.lib.geometry import Geometry

from nextgisweb.pyramid import JSONType
from nextgisweb.resource import DataScope, Resource, ResourceScope

from .interface import IFeatureLayer
from .api import filter_feature_op, FilterQueryParams

PR_R = ResourceScope.read


def identify(request) -> JSONType:
    data = request.json_body
    srs = int(data["srs"])
    geom = Geometry.from_wkt(data["geom"], srid=srs)
    styles = map(int, data["styles"])

    style_list = DBSession.query(Resource).filter(Resource.id.in_(styles))
    result = dict()

    # Number of features in all layers
    feature_count = 0

    # for layer in layer_list:
    for style in style_list:
        layer = style.parent
        layer_id_str = str(layer.id)
        if not layer.has_permission(DataScope.read, request.user):
            result[layer_id_str] = dict(error="Forbidden")

        elif not IFeatureLayer.providedBy(layer):
            result[layer_id_str] = dict(error="Not implemented")

        else:
            query = layer.feature_query()
            if style.prop["param"]:
                if style.prop["styleId"] == str(style.id):
                    filter_feature_op(query, style.prop["param"], style.prop["keys"])
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
            allow = layer.parent.has_permission(PR_R, request.user)

            if allow:
                for feature in features:
                    feature["parent"] = layer.parent.display_name

            result[layer_id_str] = dict(features=features, featureCount=len(features))

            feature_count += len(features)

    result["featureCount"] = feature_count

    return result

def identifyConst(request) -> JSONType:

    data = request.json_body
    srs = int(data['srs'])
    geom = Geometry.from_wkt(data['geom'], srid=srs)
    styles = map(int, data["styles"])

    style_list = DBSession.query(Resource).filter(Resource.id.in_(styles))

    result = dict()

    # Number of features in all layers
    feature_count = 0

    constraint = None

    for style in style_list:
        layer = style.parent
        layer_id_str = str(layer.id)
        if not layer.has_permission(DataScope.read, request.user):
            result[layer_id_str] = dict(error="Forbidden")

        elif not IFeatureLayer.providedBy(layer):
            result[layer_id_str] = dict(error="Not implemented")

        elif layer.column_from_const:
            query = layer.feature_query()
            if style.prop["param"]:
                if style.prop["styleId"] == str(style.id):
                    filter_feature_op(query, style.prop["param"], style.prop["keys"])
            query.intersects(geom)

            # Limit number of identifyable features by 10 per layer,
            # otherwise the response might be too big.
            query.limit(10)

            features = [
                dict(id=f.id, layerId=layer.id, column_from_const=layer.column_from_const, column_key=layer.column_key, column_constraint=layer.column_constraint, label=f.label, fields=f.fields)
                for f in query()
            ]

            # Add name of parent resource to identification results,
            # if there is no way to get layer name by id on the client
            allow = layer.parent.has_permission(PR_R, request.user)

            if allow:
                for feature in features:
                    feature['parent'] = layer.parent.display_name

            result[layer_id_str] = dict(
                features=features,
                featureCount=len(features),
                constraint=True
            )

            feature_count += len(features)
            constraint=True

    result['featureCount'] = feature_count
    result['constraint'] = constraint
    return result