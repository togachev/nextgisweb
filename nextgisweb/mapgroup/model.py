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


class Mapgroup(Base, Resource):
    identity = "mapgroup"
    cls_display_name = gettext("Mapgroup")

    __scope__ = DataScope

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)


class MapgroupWebMap(Base):
    __tablename__ = "group_webmap"

    webmap_id = sa.Column(sa.ForeignKey(WebMap.id), primary_key=True)
    resource_id = sa.Column(sa.ForeignKey(Resource.id), primary_key=True)
    id_pos_group = sa.Column(sa.Integer)
    display_name = sa.Column(sa.Unicode, nullable=False)
    enabled_group = sa.Column(sa.Boolean)

    webmap = orm.relationship(
        WebMap,
        foreign_keys=webmap_id,
        backref=orm.backref(
            "groups",
            cascade="all, delete-orphan",
            order_by=id_pos_group,
            collection_class=ordering_list("id_pos_group"),
        ),
    )

    resource = orm.relationship(
        Resource,
        foreign_keys=resource_id,
        backref=orm.backref(
            "_backref_group_webmap",
            cascade="all",
            cascade_backrefs=False,
        ),
    )

    def to_dict(self):
        return dict(
            resource_id=self.resource_id,
            id_pos_group=self.id_pos_group,
            display_name=self.display_name,
            enabled_group=self.enabled_group,
        )


class MapgroupWebMapItemRead(Struct, kw_only=True):
    resource_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled_group: bool


class MapgroupWebMapItemWrite(Struct, kw_only=True):
    resource_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled_group: Union[bool, UnsetType] = UNSET


class GroupsAttr(SAttribute):
    def get(self, srlzr: Serializer) -> List[MapgroupWebMapItemRead]:
        return [
            MapgroupWebMapItemRead(
                resource_id=i.resource_id,
                display_name=i.display_name,
                enabled_group=i.enabled_group,
            )
            for i in srlzr.obj.groups
        ]

    def set(self, srlzr: Serializer, value: List[MapgroupWebMapItemWrite], *, create: bool):
        srlzr.obj.groups = [MapgroupWebMap(**to_builtins(i)) for i in value]


class GroupWebMapSerializer(Serializer, resource=WebMap):
    identity = MapgroupWebMap.__tablename__

    groups = GroupsAttr(read=ResourceScope.read, write=ResourceScope.update)


class WebMapGroup(Base):
    __tablename__ = "webmap_group"

    webmap_id = sa.Column(sa.ForeignKey(WebMap.id), primary_key=True)
    resource_id = sa.Column(sa.ForeignKey(Resource.id), primary_key=True)
    id_pos_webmap = sa.Column(sa.Integer)
    display_name = sa.Column(sa.Unicode, nullable=False)
    enabled_webmap = sa.Column(sa.Boolean)

    resource = orm.relationship(
        Resource,
        foreign_keys=resource_id,
        backref=orm.backref(
            "maps",
            cascade="all, delete-orphan",
            order_by=id_pos_webmap,
            collection_class=ordering_list("id_pos_webmap"),
        ),
    )

    webmap = orm.relationship(
        WebMap,
        foreign_keys=webmap_id,
        backref=orm.backref(
            "_backref_webmap_group",
            cascade="all",
            cascade_backrefs=False,
        ),
    )

    def to_dict(self):
        return dict(
            webmap_id=self.webmap_id,
            id_pos_webmap=self.id_pos_webmap,
            display_name=self.display_name,
            enabled_webmap=self.enabled_webmap,
        )


class WebMapGroupItemRead(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled_webmap: bool


class WebMapGroupItemWrite(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled_webmap: Union[bool, UnsetType] = UNSET


class MapsAttr(SAttribute):
    def get(self, srlzr: Serializer) -> List[WebMapGroupItemRead]:
        return [
            WebMapGroupItemRead(
                webmap_id=i.webmap_id,
                display_name=i.display_name,
                enabled_webmap=i.enabled_webmap,
            )
            for i in srlzr.obj.maps
        ]

    def set(self, srlzr: Serializer, value: List[WebMapGroupItemWrite], *, create: bool):
        srlzr.obj.maps = [WebMapGroup(**to_builtins(i)) for i in value]


class WebMapGroupSerializer(Serializer, resource=Mapgroup):
    identity = WebMapGroup.__tablename__

    maps = MapsAttr(read=ResourceScope.read, write=ResourceScope.update)