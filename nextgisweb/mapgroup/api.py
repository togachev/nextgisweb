from nextgisweb.resource import CompositeSerializer, ResourceScope, PermissionsHomePage
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
    for mres in query:
        if mres.has_permission(ResourceScope.read, request.user) and mres.enabled == True and len(serializer.serialize(mres, CompositeRead).mapgroup_group["groupmaps"]):
            result.append(serializer.serialize(mres, CompositeRead))
        elif mres.has_permission(ResourceScope.update, request.user):
            result.append(serializer.serialize(mres, CompositeRead))

    manage = request.user.has_permission(PermissionsHomePage.manage)
    return dict(
        res=result,
        manage=manage
    )


def setup_pyramid(comp, config):

    config.add_route(
        "mapgroup.collection",
        "/api/mapgroup/collection",
        get=mapgroup_collection,
    )

    config.add_route(
        "mapgroup.groups",
        "/api/groups",
        post=group_post,
    )

    config.add_route(
        "mapgroup.maps",
        "/api/maps",
        post=maps_post,
    )