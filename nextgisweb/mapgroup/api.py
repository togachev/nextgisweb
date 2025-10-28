from nextgisweb.resource import Resource, ResourceScope, ResourceFactory
from .model import MapgroupResource, MapgroupGroup
from msgspec import Struct
from nextgisweb.pyramid import JSONType
from nextgisweb.env import DBSession


class MapgroupBody(Struct):
    id: int
    position: int


def maps_group(resource, request) -> JSONType:
    if resource.has_permission(ResourceScope.read, request.user):
        query = MapgroupGroup.query().filter_by(resource_id=resource.id)
        result = [itm.to_dict() for itm in query]
        return result


def mapgroup_get(request) -> JSONType:
    is_administrator = request.user.is_administrator
    query = MapgroupResource.query()
    result = [itm.to_dict() for itm in query]
    result = list()
    for resource in query:
        update = resource.has_permission(ResourceScope.update, request.user)
        if resource.has_permission(ResourceScope.read, request.user):
            itm = resource.to_dict()
            itm["update"] = update
            if itm["enabled"]:
                result.append(itm)
            elif itm["enabled"] == False and is_administrator:
                result.append(itm)
    return result


def mapgroup_post(request, body: MapgroupBody) -> JSONType:
    id = body.id
    position = body.position

    def update(id, position):
        resource = MapgroupResource.query().filter(MapgroupResource.id==id).one()
        if resource.has_permission(ResourceScope.update, request.user):
            resource.position = position

    with DBSession.no_autoflush:
        update(id, position)
    DBSession.flush()

    return(dict(id=id, position=body.position))


def maps_get(request) -> JSONType:
    query = MapgroupGroup.query()
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


def maps_post(request, body: MapgroupBody) -> JSONType:
    id = body.id
    position = body.position

    def update(id, position):
        resource = MapgroupGroup.query().filter(MapgroupGroup.id==id).one()
        resource.position = position

    with DBSession.no_autoflush:
        update(id, position)
    DBSession.flush()

    return(dict(id=id, position=body.position))


def setup_pyramid(comp, config):

    config.add_route(
        "mapgroup.item",
        "/api/mapgroup/{id}",
        factory=ResourceFactory(context=MapgroupResource),
        get=maps_group,
    )

    config.add_route(
        "mapgroup.groups",
        "/api/groups",
        get=mapgroup_get,
        post=mapgroup_post,
    )

    config.add_route(
        "mapgroup.maps",
        "/api/maps",
        get=maps_get,
        post=maps_post,
    )