from nextgisweb.resource import ResourceScope, ResourceFactory
from .model import MapgroupResource, MapgroupWebMap
from nextgisweb.webmap import WebMap
from nextgisweb.lib.apitype import AsJSON, EmptyObject
from typing import Annotated, Any, List, Literal, Union
from msgspec import UNSET, Meta, Struct, UnsetType
from nextgisweb.pyramid import JSONType
from nextgisweb.env import DBSession, gettext


def maps(resource, request) -> JSONType:
    if resource.has_permission(ResourceScope.read, request.user):
        query = MapgroupWebMap.filter_by(resource_id=resource.id)
        result = [itm.to_dict() for itm in query]
        return result


def groups(request) -> JSONType:
    query = DBSession.query(MapgroupWebMap)
    result = [itm.to_dict() for itm in query]
    return result

def setup_pyramid(comp, config):

    config.add_route(
        "mapgroup.maps",
        "/api/mapgroup/{id}/maps",
        factory=ResourceFactory(context=MapgroupResource),
        get=maps,
    )

    config.add_route(
        "mapgroup.groups",
        "/api/mapgroup/groups/",
        get=groups,
    )