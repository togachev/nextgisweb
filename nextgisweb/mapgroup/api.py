from nextgisweb.resource import ResourceScope, ResourceFactory
from .model import MapgroupGroup, WebMapGroup
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
        "mapgroup.webmap.collection",
        "/api/webmap/{id}/collection",
        factory=ResourceFactory(context=MapgroupGroup),
        get=webmap_get,
    )