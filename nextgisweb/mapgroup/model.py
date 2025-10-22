from typing import Annotated, List, Union

import sqlalchemy as sa
import sqlalchemy.orm as orm
from msgspec import UNSET, Meta, Struct, UnsetType, to_builtins
from sqlalchemy.ext.orderinglist import ordering_list

from nextgisweb.env import Base, gettext

from nextgisweb.resource import (
    DataScope,
    Resource,
    ResourceGroup,
    ResourceScope,
    SAttribute,
    SColumn,
    Serializer,
)
from nextgisweb.webmap import WebMap


class MapgroupResource(Base, Resource):
    identity = "mapgroup_resource"
    cls_display_name = gettext("Map groups")

    __scope__ = DataScope


    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)


class WebMapGroup(Base):
    __tablename__ = "webmap_group"

    webmap_id = sa.Column(sa.ForeignKey(WebMap.id), primary_key=True)
    resource_id = sa.Column(sa.ForeignKey(Resource.id), primary_key=True)
    position = sa.Column(sa.Integer)
    display_name = sa.Column(sa.Unicode, nullable=False)
    enabled = sa.Column(sa.Boolean)

    resource = orm.relationship(
        Resource,
        foreign_keys=resource_id,
        backref=orm.backref(
            "maps",
            cascade="all, delete-orphan",
            order_by=position,
            collection_class=ordering_list("position"),
        ),
    )

    webmap = orm.relationship(
        WebMap,
        foreign_keys=webmap_id,
        backref=orm.backref(
            "webmap_group",
            cascade="all",
            cascade_backrefs=False,
        ),
    )

    def to_dict(self):
        return dict(
            webmap_id=self.webmap_id,
            resource_id=self.resource_id,
            position=self.position,
            display_name=self.display_name,
            enabled=self.enabled,
        )


class WebMapGroupItemRead(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: bool


class WebMapGroupItemWrite(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: Union[bool, UnsetType] = UNSET


class MapsAttr(SAttribute):
    def get(self, srlzr: Serializer) -> List[WebMapGroupItemRead]:
        return [
            WebMapGroupItemRead(
                webmap_id=i.webmap_id,
                display_name=i.display_name,
                enabled=i.enabled,
            )
            for i in srlzr.obj.maps
        ]

    def set(self, srlzr: Serializer, value: List[WebMapGroupItemWrite], *, create: bool):
        srlzr.obj.maps = [WebMapGroup(**to_builtins(i)) for i in value]


class WebMapGroupSerializer(Serializer, resource=MapgroupResource):
    identity = WebMapGroup.__tablename__

    maps = MapsAttr(read=ResourceScope.read, write=ResourceScope.update)


class GroupItemRead(Struct, kw_only=True):
    resource_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: bool


class MapgroupsAttr(SAttribute):
    def get(self, srlzr: Serializer) -> dict:
        return [
            GroupItemRead(
                resource_id=i.resource_id,
                display_name=Resource.filter(Resource.id == i.resource_id).first().display_name,
                enabled=i.enabled,
            )
            for i in srlzr.obj.webmap_group
        ]


class MapgroupResourceSerializer(Serializer, resource=WebMap):
    identity = "mapgroup_resource"
    groups = MapgroupsAttr(read=ResourceScope.read)