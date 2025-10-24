from nextgisweb.resource import Resource, ResourceScope, ResourceFactory
from .model import MapgroupResource, MapgroupWebMap
from nextgisweb.webmap import WebMap
from nextgisweb.lib.apitype import AsJSON, EmptyObject
from typing import Annotated, Any, List, Literal, Union
from msgspec import UNSET, Meta, Struct, UnsetType
from nextgisweb.pyramid import JSONType
from nextgisweb.env import DBSession, gettext


def maps_group(resource, request) -> JSONType:
    if resource.has_permission(ResourceScope.read, request.user):
        query = MapgroupWebMap.query().filter_by(resource_id=resource.id)
        result = [itm.to_dict() for itm in query]
        return result


def mapgroup(request) -> JSONType:
    query = MapgroupResource.query()
    result = [itm.to_dict() for itm in query]
    return result


def groupmaps(request) -> JSONType:
    query = MapgroupWebMap.query()
    result = list()
    for item in query:
        itm = item.to_dict()
        id = itm["id"]
        resource = Resource.filter_by(id=id).one()
        update = resource.has_permission(ResourceScope.update, request.user)
        itm["update"] = update
        if resource.has_permission(ResourceScope.read, request.user):
            result.append(itm)

    return result


def setup_pyramid(comp, config):

    config.add_route(
        "mapgroup.maps",
        "/api/mapgroup/{id}/maps",
        factory=ResourceFactory(context=MapgroupResource),
        get=maps_group,
    )

    config.add_route(
        "mapgroup.groups",
        "/api/mapgroup",
        get=mapgroup,
    )

    config.add_route(
        "mapgroup.groupmaps",
        "/api/groupmaps",
        get=groupmaps,
    )