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
    cls_display_name = gettext("Web Map Group")

    __scope__ = DataScope

    position_map = sa.Column(sa.Integer, nullable=True)
    enabled = sa.Column(sa.Boolean, default=True)

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    def to_dict(self):
        return dict(
            id=self.id,
            id_pos=self.position_map,
            enabled=self.enabled,
            webmap_group_name=self.display_name,
        )


class MapgroupResourceItemRead(Struct, kw_only=True):
    position_map: int


class MapgroupResourceItemWrite(Struct, kw_only=True):
    position_map: int


class MapgroupResourceAttr(SAttribute):
    def get(self, srlzr: Serializer) -> MapgroupResourceItemRead:
        return srlzr.obj.position_map

    def set(self, srlzr: Serializer, value: MapgroupResourceItemWrite, *, create: bool):
        srlzr.obj.position_map = value


class MapgroupResourceSerializer(Serializer, resource=MapgroupResource):
    enabled = SColumn(read=DataScope.read, write=DataScope.write)
    position_map = MapgroupResourceAttr(read=ResourceScope.read, write=ResourceScope.update)

class MapgroupWebMap(Base):
    __tablename__ = "mapgroup_webmap"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    webmap_id = sa.Column(sa.ForeignKey(WebMap.id), primary_key=True)
    resource_id = sa.Column(sa.ForeignKey(Resource.id), primary_key=True)
    position_group = sa.Column(sa.Integer, nullable=True)
    display_name = sa.Column(sa.Unicode, nullable=False)
    enabled = sa.Column(sa.Boolean)
    
    webmap = orm.relationship(
        WebMap,
        foreign_keys=webmap_id,
        backref=orm.backref(
            "mapgroups",
            cascade="all, delete-orphan",
        ),
    )

    resource = orm.relationship(
        Resource,
        foreign_keys=resource_id,
        backref=orm.backref(
            "mapgroup_webmap",
            cascade="all",
            cascade_backrefs=False,
        ),
    )

    @property
    def webmap_name(self):
        return self.webmap.display_name

    @property
    def preview_fileobj_id(self):
        social = self.webmap.social
        return None if social == None else social.preview_fileobj_id

    @property
    def preview_description(self):
        social = self.webmap.social
        return None if social == None else social.preview_description

    @property
    def description_status(self):
        return self.webmap.description_status(self.webmap)

    def to_dict(self):
        return dict(
            id=self.webmap_id,
            value=self.webmap_id,
            owner=True,
            display_name=self.webmap_name,
            label=self.webmap_name,
            description_status=self.description_status,
            webmap_group_name=self.display_name,
            webmap_group_id=self.resource_id,
            idx=self.id,
            id_pos=self.position_group,
            enabled=self.enabled,
            preview_fileobj_id=self.preview_fileobj_id,
            preview_description=self.preview_description,
        )


class MapgroupWebMapItemRead(Struct, kw_only=True):
    resource_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: bool


class MapgroupWebMapItemWrite(Struct, kw_only=True):
    resource_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: Union[bool, UnsetType] = UNSET


class MapgroupAttr(SAttribute):
    def get(self, srlzr: Serializer) -> List[MapgroupWebMapItemRead]:
        return [
            MapgroupWebMapItemRead(
                resource_id=i.resource_id,
                display_name=i.display_name,
                enabled=i.enabled,
            )
            for i in srlzr.obj.mapgroups
        ]

    def set(self, srlzr: Serializer, value: List[MapgroupWebMapItemWrite], *, create: bool):
        srlzr.obj.mapgroups = [MapgroupWebMap(**to_builtins(i)) for i in value]


class MapgroupWebMapSerializer(Serializer, resource=WebMap):
    identity = MapgroupWebMap.__tablename__

    mapgroups = MapgroupAttr(read=ResourceScope.read, write=ResourceScope.update)