from nextgisweb.resource import CompositeSerializer, Resource, ResourceScope, ResourceFactory
from .model import MapgroupResource, MapgroupWebMap
from nextgisweb.webmap import WebMap
from nextgisweb.lib.apitype import AsJSON, EmptyObject
from typing import Dict, TYPE_CHECKING, Annotated, Any, List, Literal, Union
from msgspec import UNSET, Meta, Struct, UnsetType
from nextgisweb.pyramid import JSONType
from nextgisweb.env import DBSession, gettext
from nextgisweb.lib.apitype import AnyOf, EmptyObject, Query, StatusCode, annotate
from nextgisweb.lib.msext import DEPRECATED

if TYPE_CHECKING:
    CompositeCreate = Struct
    CompositeRead = Struct
    CompositeUpdate = Struct
else:
    composite = CompositeSerializer.types()
    CompositeCreate = composite.create
    CompositeRead = composite.read
    CompositeUpdate = composite.update


class RelationshipRef(Struct, kw_only=True):
    id: int


class ResourceRef(RelationshipRef, kw_only=True):
    id: int


class ResourceRefOptional(Struct, kw_only=True):
    id: Union[int, None]


class ResourceRefWithParent(ResourceRef, kw_only=True):
    parent: Annotated[ResourceRefOptional, DEPRECATED]


def maps_group(resource, request) -> JSONType:
    if resource.has_permission(ResourceScope.read, request.user):
        query = MapgroupWebMap.query().filter_by(resource_id=resource.id)
        result = [itm.to_dict() for itm in query]
        return result


def mapgroup_get(request) -> JSONType:
    is_administrator = request.user.is_administrator
    query = MapgroupResource.query()
    result = [itm.to_dict() for itm in query]
    result = list()
    for item in query:
        itm = item.to_dict()
        if itm["enabled"]:
            result.append(itm)
        elif itm["enabled"] == False and is_administrator:
            result.append(itm)
    return result


class MapgroupPositionBody(Struct):
    position_map: int

class MapgroupBody(Struct):
    id: int
    mapgroup_resource: Union[MapgroupPositionBody, UnsetType] = UNSET


def mapgroup_post(request, body: MapgroupBody) -> JSONType:
    id = body.id
    resource = Resource.registry["mapgroup_resource"](owner_user=request.user)
    serializer = CompositeSerializer(user=request.user)
    resource.persist()
    body.resource = resource
    body.resource.mapgroup_resource = body.mapgroup_resource
    with DBSession.no_autoflush:
        serializer.deserialize(resource, body)

    DBSession.flush()
    raise ValueError(dir(body))


def groupmaps(request) -> JSONType:
    query = MapgroupWebMap.query()
    result = list()
    for item in query:
        itm = item.to_dict()
        id = itm["id"]
        is_administrator = request.user.is_administrator
        resource = Resource.filter_by(id=id).one()
        update = resource.has_permission(ResourceScope.update, request.user)
        itm["update"] = update
        if resource.has_permission(ResourceScope.read, request.user):
            if itm["enabled"]:
                result.append(itm)
            elif itm["enabled"] == False and is_administrator:
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
        get=mapgroup_get,
        post=mapgroup_post,
    )

    config.add_route(
        "mapgroup.groupmaps",
        "/api/groupmaps",
        get=groupmaps,
    )