from nextgisweb.resource import ResourceScope, ResourceFactory
from .model import MapgroupResource, WebMapGroup
from nextgisweb.webmap import WebMap
from nextgisweb.lib.apitype import AsJSON, EmptyObject
from typing import Annotated, Any, List, Literal, Union
from msgspec import UNSET, Meta, Struct, UnsetType
from nextgisweb.pyramid import JSONType
from nextgisweb.env import DBSession, gettext


def webmap_get(resource, request) -> JSONType:
    if resource.has_permission(ResourceScope.read, request.user):
        query = WebMapGroup.filter_by(resource_id=resource.id)
        result = [itm.to_dict() for itm in query]
        return result


def setup_pyramid(comp, config):

    config.add_route(
        "mapgroup.maps.collection",
        "/api/maps/{id}/collection",
        factory=ResourceFactory(context=MapgroupResource),
        get=webmap_get,
    )