from typing import Annotated, List, Union

import sqlalchemy as sa
import sqlalchemy.orm as orm
from msgspec import UNSET, Meta, Struct, UnsetType, to_builtins
from sqlalchemy.ext.orderinglist import ordering_list
from nextgisweb.env import Base, gettext
from nextgisweb.auth import Permission

from nextgisweb.resource import (
    Resource,
    ResourceGroup,
    ResourceScope,
    SAttribute,
    SColumn,
    Serializer,
)
from nextgisweb.webmap import WebMap

class permissions:
    manage = Permission("manage", gettext("Web map groups"), "manage")
    all = (manage)

class MapgroupResource(Base, Resource):
    identity = "mapgroup_resource"
    cls_display_name = gettext("Web Map Group")

    __scope__ = ResourceScope

    position = sa.Column(sa.Integer, nullable=True)
    enabled = sa.Column(sa.Boolean, default=True)

    @classmethod
    def check_parent(cls, parent):
        return isinstance(parent, ResourceGroup)


class MapgroupResourceSerializer(Serializer, resource=MapgroupResource):
    enabled = SColumn(read=ResourceScope.read, write=ResourceScope.update)
    position = SColumn(read=ResourceScope.read, write=ResourceScope.update)


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

    @property
    def enabled_group(self):
        return self.resource.enabled


class MapgroupGroupItemRead(Struct, kw_only=True):
    webmap_id: int
    value: int
    display_name: Annotated[str, Meta(min_length=1)]
    label: Annotated[str, Meta(min_length=1)]
    description_status: Union[bool, UnsetType] = UNSET
    webmap_group_name: Annotated[str, Meta(min_length=1)]
    webmap_group_id: int
    id: int
    position: int
    enabled: Union[bool, UnsetType] = UNSET
    preview_fileobj_id: int
    preview_description: Annotated[str, Meta(min_length=1)]


class MapgroupGroupItemWrite(Struct, kw_only=True):
    webmap_id: int
    display_name: Annotated[str, Meta(min_length=1)]
    enabled: Union[bool, UnsetType] = UNSET


class GroupmapsAttr(SAttribute):
    def get(self, srlzr: Serializer) -> List[MapgroupGroupItemRead]:
        def value(i):
            return MapgroupGroupItemRead(
                webmap_id=i.webmap_id,
                value=i.webmap_id,
                display_name=i.webmap_name,
                label=i.webmap_name,
                description_status=i.description_status,
                webmap_group_name=i.webmap_group_name,
                webmap_group_id=i.resource_id,
                id=i.id,
                position=i.position,
                enabled=i.enabled,
                preview_fileobj_id=i.preview_fileobj_id,
                preview_description=i.preview_description,
            )

        result = list()
        for i in srlzr.obj.groupmaps:
            if Resource.filter_by(id=i.webmap_id).one().has_permission(ResourceScope.read, srlzr.user) and i.enabled == True:
                result.append(value(i))
            elif Resource.filter_by(id=i.webmap_id).one().has_permission(ResourceScope.update, srlzr.user):
                result.append(value(i))

        return result

    def set(self, srlzr: Serializer, value: List[MapgroupGroupItemWrite], *, create: bool):
        srlzr.obj.groupmaps = [MapgroupGroup(**to_builtins(i)) for i in value]


class MapgroupGroupSerializer(Serializer, resource=MapgroupResource):
    identity = MapgroupGroup.__tablename__

    groupmaps = GroupmapsAttr(read=ResourceScope.read, write=ResourceScope.update, required=True)