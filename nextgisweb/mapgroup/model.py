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

    __scope__ = ResourceScope

    position = sa.Column(sa.Integer, nullable=True)
    enabled = sa.Column(sa.Boolean, default=True)

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)

    def to_dict(self):
        return dict(
            id=self.id,
            position=self.position,
            enabled=self.enabled,
            webmap_group_name=self.display_name,
        )


class MapgroupResourceSerializer(Serializer, resource=MapgroupResource):
    enabled = SColumn(read=ResourceScope.read, write=ResourceScope.update)


class MapgroupGroup(Base):
    __tablename__ = "mapgroup_group"

    id = sa.Column(sa.Integer, primary_key=True, autoincrement=True)
    webmap_id = sa.Column(sa.ForeignKey(WebMap.id), primary_key=True)
    resource_id = sa.Column(sa.ForeignKey(Resource.id), primary_key=True)
    position = sa.Column(sa.Integer)
    display_name = sa.Column(sa.Unicode, nullable=False)
    enabled = sa.Column(sa.Boolean)

    resource = orm.relationship(
        Resource,
        foreign_keys=resource_id,
        backref=orm.backref(
            "groupmaps",
            cascade="all, delete-orphan",
            order_by=position,
            collection_class=ordering_list("position"),
        ),
    )

    webmap = orm.relationship(
        WebMap,
        foreign_keys=webmap_id,
        backref=orm.backref(
            "_backref_mapgroup_group",
            cascade="all",
            cascade_backrefs=False,
        ),
    )

    @property
    def webmap_group_name(self):
        return self.resource.display_name

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
            webmap_group_name=self.webmap_group_name,
            webmap_group_id=self.resource_id,
            idx=self.id,
            position=self.position,
            enabled=self.enabled,
            preview_fileobj_id=self.preview_fileobj_id,
            preview_description=self.preview_description,
        )


class MapgroupGroupItemRead(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: bool


class MapgroupGroupItemWrite(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: Union[bool, UnsetType] = UNSET


class GroupmapsAttr(SAttribute):
    def get(self, srlzr: Serializer) -> List[MapgroupGroupItemRead]:
        return [
            dict(
                webmap_id=i.webmap_id,
                display_name=i.display_name,
                enabled=i.enabled,
            )
            for i in srlzr.obj.groupmaps
            if Resource.filter_by(id=i.webmap_id).one().has_permission(ResourceScope.update, srlzr.user)
        ]

    def set(self, srlzr: Serializer, value: List[MapgroupGroupItemWrite], *, create: bool):
        srlzr.obj.groupmaps = [MapgroupGroup(**to_builtins(i)) for i in value]


class MapgroupGroupSerializer(Serializer, resource=MapgroupResource):
    identity = MapgroupGroup.__tablename__

    groupmaps = GroupmapsAttr(read=ResourceScope.read, write=ResourceScope.update, required=True)