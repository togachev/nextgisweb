from nextgisweb.resource import CompositeSerializer, Resource, ResourceScope, ResourceFactory
from .model import MapgroupResource, MapgroupGroup
from msgspec import Meta, Struct
from nextgisweb.pyramid import JSONType
from nextgisweb.env import DBSession
from typing import Annotated, List


CompositeRead = CompositeSerializer.types().update


class MapgroupItem(Struct, kw_only=True):
    id: int
    position: int


class MapgroupBody(Struct, kw_only=True):
    params: List[MapgroupItem]


def maps_group(resource, request) -> JSONType:
    if resource.has_permission(ResourceScope.read, request.user):
        query = MapgroupGroup.query().filter_by(resource_id=resource.id)
        result = [itm.to_dict() for itm in query]
        return result


def group_get(request) -> JSONType:
    query = MapgroupResource.query()
    result = list()
    for resource in query:
        itm = resource.to_dict()
        update = resource.has_permission(ResourceScope.update, request.user)
        itm["update"] = update
        if update:
            result.append(itm)
    return result


def group_post(request, body: MapgroupBody) -> JSONType:
    def update(id, position):
        resource = MapgroupResource.query().filter(MapgroupResource.id==id).one()
        if resource.has_permission(ResourceScope.update, request.user):
            resource.position = position

    with DBSession.no_autoflush:
        for item in body.params:
            id = item.id
            position = item.position
            update(id, position)
    DBSession.flush()

    return body.params


def maps_get(request) -> JSONType:
    query = MapgroupGroup.query()
    result = list()
    for item in query:
        itm = item.to_dict()
        id = itm["id"]
        resource = Resource.filter_by(id=id).one()
        update = resource.has_permission(ResourceScope.update, request.user)
        itm["update"] = update
        if update :
            result.append(itm)
    return result


def maps_post(request, body: MapgroupBody) -> JSONType:
    def update(id, position):
        resource = MapgroupGroup.query().filter(MapgroupGroup.id==id).one()
        resource.position = position

    with DBSession.no_autoflush:
        for item in body.params:
            id = item.id
            position = item.position
            update(id, position)
    DBSession.flush()

    return body.params


def mapgroup_collection(
        request,
        *,
        description: Annotated[
            bool,
            Meta(description="Description resources"),
        ] = False,
        mapgroup: Annotated[
            bool,
            Meta(description="Mapgroup resources"),
        ] = True,
) -> JSONType:
    query = MapgroupResource.query()
    serializer = CompositeSerializer(
        description=description,
        mapgroup=mapgroup,
        user=request.user
    )
    result = list()
    update = False
    check_perm = lambda res, u=request.user: res.has_permission(ResourceScope.update, u)
    for mres in query:
        if mres.has_permission(ResourceScope.read, request.user) and mres.enabled == True and len(serializer.serialize(mres, CompositeRead).mapgroup_group["groupmaps"]):
            result.append(serializer.serialize(mres, CompositeRead))
            update=check_perm(mres)
        elif mres.has_permission(ResourceScope.update, request.user):
            result.append(serializer.serialize(mres, CompositeRead))
            update=check_perm(mres)

    return dict(
        res=result,
        update=update,
        isAdministrator=request.user.is_administrator,
    )


def setup_pyramid(comp, config):

    config.add_route(
        "mapgroup.collection",
        "/api/mapgroup/collection",
        get=mapgroup_collection,
    )

    config.add_route(
        "mapgroup.item",
        "/api/mapgroup/{id}",
        factory=ResourceFactory(context=MapgroupResource),
        get=maps_group,
    )

    config.add_route(
        "mapgroup.groups",
        "/api/groups",
        get=group_get,
        post=group_post,
    )

    config.add_route(
        "mapgroup.maps",
        "/api/maps",
        get=maps_get,
        post=maps_post,
    )