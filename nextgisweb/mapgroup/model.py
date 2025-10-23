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

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    def to_dict(self):
        return dict(
            position_map=self.position_map,
            display_name=self.display_name,
        )

class MapgroupWebMap(Base):
    __tablename__ = "mapgroup_webmap"

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

    webmap_name = orm.column_property(
        sa.select(WebMap.display_name)
        .where(WebMap.id == webmap_id)
        .scalar_subquery()
    )

    def to_dict(self):
        return dict(
            webmap_id=self.webmap_id,
            resource_id=self.resource_id,
            position_group=self.position_group,
            display_name=self.display_name,
            enabled=self.enabled,
            webmap_name=self.webmap_name,
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