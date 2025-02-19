from typing import TYPE_CHECKING, Any, ClassVar, Dict, List, Literal, Mapping, Union, cast

import sqlalchemy as sa
import sqlalchemy.orm as orm
import zope.event
import zope.event.classhandler
from msgspec import UNSET, DecodeError, Meta, Struct, UnsetType, defstruct, field, to_builtins
from msgspec import ValidationError as MsgspecValidationError
from msgspec.json import Decoder
from pyramid.httpexceptions import HTTPBadRequest
from sqlalchemy.orm import with_polymorphic
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.sql import exists
from sqlalchemy.sql import or_ as sa_or
from sqlalchemy.sql.operators import eq as eq_op
from sqlalchemy.sql.operators import ilike_op, in_op, like_op
from typing_extensions import Annotated
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from ..postgis.exception import ExternalDatabaseError

from nextgisweb.env import DBSession, gettext
from nextgisweb.lib.apitype import AnyOf, EmptyObject, Query, StatusCode, annotate
from nextgisweb.lib.msext import DEPRECATED

from nextgisweb.auth import User
from nextgisweb.auth.api import UserID
from nextgisweb.core.exception import InsufficientPermissions, UserException, ValidationError
from nextgisweb.jsrealm import TSExport
from nextgisweb.pyramid import AsJSON, JSONType
from nextgisweb.pyramid.api import csetting, require_storage_enabled

from .category import ResourceCategory, ResourceCategoryIdentity
from .composite import CompositeSerializer
from .event import AfterResourceCollectionPost, AfterResourcePut, OnDeletePrompt
from .exception import (
    HierarchyError,
    QuotaExceeded,
    ResourceNotFound,
    ResourceRootDeleteError,
)
from .model import Resource, ResourceWebMapGroup, WebMapGroupResource, ResourceCls, ResourceInterfaceIdentity, ResourceScopeIdentity
from ..social.model import ResourceSocial
from .presolver import ExplainACLRule, ExplainDefault, ExplainRequirement, PermissionResolver
from .sattribute import ResourceRefOptional, ResourceRefWithParent
from .scope import ResourceScope, Scope
from .view import ResourceID, resource_factory
from .widget import CompositeWidget


class BlueprintResource(Struct):
    identity: ResourceCls
    label: str
    base_classes: List[ResourceCls]
    interfaces: List[ResourceInterfaceIdentity]
    scopes: List[ResourceScopeIdentity]
    category: ResourceCategoryIdentity
    order: int


class BlueprintPermission(Struct):
    identity: str
    label: str


class BlueprintScope(Struct):
    identity: ResourceScopeIdentity
    label: str
    permissions: Dict[str, BlueprintPermission]


class BlueprintCategory(Struct):
    identity: ResourceCategoryIdentity
    label: str
    order: int


class Blueprint(Struct):
    resources: Dict[ResourceCls, BlueprintResource]
    scopes: Dict[ResourceScopeIdentity, BlueprintScope]
    categories: Dict[ResourceCategoryIdentity, BlueprintCategory]


def blueprint(request) -> Blueprint:
    """Read schema for resources, scopes, and categories"""
    tr = request.translate
    return Blueprint(
        resources={
            identity: BlueprintResource(
                identity=identity,
                label=tr(cls.cls_display_name),
                base_classes=list(
                    reversed(
                        [
                            bc.identity
                            for bc in cls.__mro__
                            if (bc != cls and issubclass(bc, Resource))
                        ]
                    )
                ),
                interfaces=[i.__name__ for i in cls.implemented_interfaces()],
                scopes=list(cls.scope.keys()),
                category=cls.cls_category.identity,
                order=cls.cls_order,
            )
            for identity, cls in Resource.registry.items()
        },
        scopes={
            sid: BlueprintScope(
                identity=sid,
                label=tr(scope.label),
                permissions={
                    perm.name: BlueprintPermission(
                        identity=perm.name,
                        label=tr(perm.label),
                    )
                    for perm in scope.values()
                },
            )
            for sid, scope in Scope.registry.items()
        },
        categories={
            identity: BlueprintCategory(
                identity=identity,
                label=tr(category.label),
                order=category.order,
            )
            for identity, category in ResourceCategory.registry.items()
        },
    )


if TYPE_CHECKING:
    CompositeCreate = Struct
    CompositeRead = Struct
    CompositeUpdate = Struct
else:
    composite = CompositeSerializer.types()
    CompositeCreate = composite.create
    CompositeRead = composite.read
    CompositeUpdate = composite.update


def item_get(context, request) -> CompositeRead:
    """Read resource"""
    request.resource_permission(ResourceScope.read)

    serializer = CompositeSerializer(user=request.user)
    return serializer.serialize(context, CompositeRead)


def item_put(context, request, body: CompositeUpdate) -> EmptyObject:
    """Update resource"""
    request.resource_permission(ResourceScope.read)

    serializer = CompositeSerializer(user=request.user)
    with DBSession.no_autoflush:
        serializer.deserialize(context, body)

    zope.event.notify(AfterResourcePut(context, request))


def item_delete(context, request) -> EmptyObject:
    """Delete resource"""

    def delete(obj):
        request.resource_permission(ResourceScope.delete, obj)
        request.resource_permission(ResourceScope.manage_children, obj)

        for chld in obj.children:
            delete(chld)

        DBSession.delete(obj)

    if context.id == 0:
        raise ResourceRootDeleteError

    if not OnDeletePrompt.apply(context):
        raise HierarchyError

    with DBSession.no_autoflush:
        delete(context)

    DBSession.flush()


def collection_get(
    request,
    *,
    parent: Union[int, None] = None,
) -> AsJSON[List[CompositeRead]]:
    """Read children resources"""
    query = (
        Resource.query()
        .filter_by(parent_id=parent)
        .order_by(Resource.display_name)
        .options(orm.subqueryload(Resource.acl))
    )

    serializer = CompositeSerializer(user=request.user)
    result = list()
    for resource in query:
        if resource.has_permission(ResourceScope.read, request.user):
            result.append(serializer.serialize(resource, CompositeRead))

    serializer = CompositeSerializer(user=request.user)
    check_perm = lambda res, u=request.user: res.has_permission(ResourceScope.read, u)
    resources = [res for res in query if check_perm(res)]
    resources.sort(key=lambda res: (res.cls_order, res.display_name))
    return [serializer.serialize(res, CompositeRead) for res in resources]


def collection_post(
    request, body: CompositeCreate
) -> Annotated[ResourceRefWithParent, StatusCode(201)]:
    """Create resource"""

    request.env.core.check_storage_limit()

    resource_cls = body.resource.cls
    resource = Resource.registry[resource_cls](owner_user=request.user)
    serializer = CompositeSerializer(user=request.user)

    resource.persist()
    with DBSession.no_autoflush:
        serializer.deserialize(resource, body)

    DBSession.flush()

    request.audit_context("resource", resource.id)
    zope.event.notify(AfterResourceCollectionPost(resource, request))

    request.response.status_code = 201
    parent_ref = ResourceRefOptional(id=resource.parent.id)
    return ResourceRefWithParent(id=resource.id, parent=parent_ref)


DeleteResources = Annotated[List[ResourceID], Meta(description="Resource IDs to delete")]


class ResourceDeleteSummary(Struct, kw_only=True):
    count: Annotated[int, Meta(description="Total number of resources")]
    resources: Annotated[Dict[ResourceCls, int], Meta(description="Number of resources by class")]

    @classmethod
    def from_resources(cls, resources):
        return cls(
            count=sum(resources.values()),
            resources=resources,
        )


class ResourceDeleteGetResponse(Struct, kw_only=True):
    affected: Annotated[
        ResourceDeleteSummary,
        Meta(description="Summary on deletable resources"),
    ]
    unaffected: Annotated[
        ResourceDeleteSummary,
        Meta(description="Summary on non-deletable resources"),
    ]


def _delete_multiple(request, resource_ids, partial, *, dry_run):
    affected = dict()
    unaffected = dict()

    def _acc(d, cls, v=1):
        if cls not in d:
            d[cls] = v
        else:
            d[cls] += v

    def delete(resource):
        if resource.id == 0:
            raise ResourceRootDeleteError

        _affected = dict()

        def _delete(resource):
            request.resource_permission(ResourceScope.delete, resource)
            request.resource_permission(ResourceScope.manage_children, resource)

            for child in resource.children:
                _delete(child)

            if not dry_run:
                DBSession.delete(resource)
            _acc(_affected, resource.cls)

        _delete(resource)
        return _affected

    for rid in resource_ids:
        cls = "resource"

        try:
            resource = Resource.filter_by(id=rid).one()
        except NoResultFound:
            if not partial:
                raise ResourceNotFound(rid)
        else:
            try:
                resource_affected = delete(resource)
            except UserException:
                if not partial:
                    raise
                if resource.has_permission(ResourceScope.read, request.user):
                    cls = resource.cls
            else:
                for k, v in resource_affected.items():
                    _acc(affected, k, v)
                continue

        _acc(unaffected, cls)

    return ResourceDeleteGetResponse(
        affected=ResourceDeleteSummary.from_resources(resources=affected),
        unaffected=ResourceDeleteSummary.from_resources(resources=unaffected),
    )


def delete_get(request, *, resources: DeleteResources) -> ResourceDeleteGetResponse:
    """Simulate deletion of multiple resources"""
    return _delete_multiple(request, resources, True, dry_run=True)


def delete_post(
    request,
    *,
    resources: DeleteResources,
    partial: Annotated[
        bool,
        Meta(description="Skip non-deletable resources"),
    ] = False,
) -> EmptyObject:
    """Delete multiple resources"""

    with DBSession.no_autoflush:
        _delete_multiple(request, resources, partial, dry_run=False)


if TYPE_CHECKING:
    scope_permissions_struct: Mapping[str, Any] = dict()

    class EffectivePermissions(Struct, kw_only=True):
        pass

else:
    scope_permissions_struct = dict()
    for sid, scope in Scope.registry.items():
        struct = defstruct(
            f"{scope.__name__}Permissions",
            [
                (
                    perm.name,
                    annotate(bool, [Meta(description=f"{scope.label}: {perm.label}")]),
                )
                for perm in scope.values()
            ],
            module=scope.__module__,
        )
        struct = annotate(struct, [Meta(description=str(scope.label))])
        scope_permissions_struct[sid] = struct

    EffectivePermissions = defstruct(
        "EffectivePermissions",
        [
            ((sid, struct) if sid == "resource" else (sid, Union[(struct, UnsetType)], UNSET))
            for sid, struct in scope_permissions_struct.items()
        ],
    )


def permission(
    resource,
    request,
    *,
    user: Union[UserID, None] = None,
) -> EffectivePermissions:
    """Get resource effective permissions"""
    request.resource_permission(ResourceScope.read)

    user_obj = User.filter_by(id=user).one() if (user is not None) else request.user
    if user_obj.id != request.user.id:
        request.resource_permission(ResourceScope.change_permissions)

    effective = resource.permissions(user_obj)
    return EffectivePermissions(
        **{
            sid: scope_permissions_struct[sid](
                **{p.name: (p in effective) for p in scope.values()},
            )
            for sid, scope in resource.scope.items()
        }
    )


def permission_explain(request) -> JSONType:
    """Explain effective resource permissions"""
    request.resource_permission(ResourceScope.read)

    req_scope = request.params.get("scope")
    req_permission = request.params.get("permission")

    req_user_id = request.params.get("user")
    user = User.filter_by(id=req_user_id).one() if req_user_id is not None else request.user
    other_user = user != request.user
    if other_user:
        request.resource_permission(ResourceScope.change_permissions)

    resource = request.context

    if req_scope is not None or req_permission is not None:
        permissions = list()
        for perm in resource.class_permissions():
            if req_scope is None or perm.scope.identity == req_scope:
                if req_permission is None or perm.name == req_permission:
                    permissions.append(perm)
        if len(permissions) == 0:
            raise ValidationError(gettext("Permission not found"))
    else:
        permissions = None

    resolver = PermissionResolver(request.context, user, permissions, explain=True)

    def _jsonify_principal(principal):
        result = dict(id=principal.id)
        result["cls"] = {"U": "user", "G": "group"}[principal.cls]
        if principal.system:
            result["keyname"] = principal.keyname
        return result

    def _explain_jsonify(value):
        if value is None:
            return None

        result = dict()
        for scope_identity, scope in value.resource.scope.items():
            n_scope = result.get(scope_identity)
            for perm in scope.values():
                if perm in value._result:
                    if n_scope is None:
                        n_scope = result[scope_identity] = dict()
                    n_perm = n_scope[perm.name] = dict()
                    n_perm["result"] = value._result[perm]
                    n_explain = n_perm["explain"] = list()
                    for item in value._explanation[perm]:
                        i_res = item.resource

                        n_item = dict(
                            result=item.result,
                            resource=dict(id=i_res.id) if i_res else None,
                        )

                        n_explain.append(n_item)
                        if isinstance(item, ExplainACLRule):
                            n_item["type"] = "acl_rule"
                            if i_res.has_permission(ResourceScope.read, request.user):
                                n_item["acl_rule"] = {
                                    "action": item.acl_rule.action,
                                    "principal": _jsonify_principal(item.acl_rule.principal),
                                    "scope": item.acl_rule.scope,
                                    "permission": item.acl_rule.permission,
                                    "identity": item.acl_rule.identity,
                                    "propagate": item.acl_rule.propagate,
                                }

                        elif isinstance(item, ExplainRequirement):
                            n_item["type"] = "requirement"
                            if i_res is None or i_res.has_permission(
                                ResourceScope.read, request.user
                            ):
                                n_item["requirement"] = {
                                    "scope": item.requirement.src.scope.identity,
                                    "permission": item.requirement.src.name,
                                    "attr": item.requirement.attr,
                                    "attr_empty": item.requirement.attr_empty,
                                }
                                n_item["satisfied"] = item.satisfied
                                n_item["explain"] = _explain_jsonify(item.resolver)

                        elif isinstance(item, ExplainDefault):
                            n_item["type"] = "default"

                        else:
                            raise ValueError("Unknown explain item: {}".format(item))
        return result

    return _explain_jsonify(resolver)


class SearchRootParams(Struct, kw_only=True):
    root: Annotated[
        Union[ResourceID, UnsetType],
        Meta(description="Starting resource ID for recursive search"),
    ] = UNSET

    parent_id__recursive: Annotated[
        Union[ResourceID, UnsetType],
        Meta(description="Use `root` instead"),
        DEPRECATED,
    ] = UNSET

    def query(self):
        if (root := self.root) is UNSET:
            root = self.parent_id__recursive

        result = sa.select(Resource)
        if root is not UNSET:
            child = (
                sa.select(Resource.id, sa.literal_column("0").label("depth"))
                .where(Resource.id == root)
                .cte("child", recursive=True)
            )

            child = child.union_all(
                sa.select(Resource.id, sa.literal_column("depth + 1")).where(
                    Resource.parent_id == child.c.id
                )
            )

            result = result.join(child, Resource.id == child.c.id)

        return result


class SearchAttrParams(Struct, kw_only=True):
    id: Annotated[
        Union[ResourceID, UnsetType],
        Meta(description="Filter by exact ID"),
    ] = UNSET

    id__eq: Annotated[
        Union[ResourceID, UnsetType],
        Meta(description="Use `id` instead"),
        DEPRECATED,
    ] = UNSET

    id__in: Annotated[
        Union[List[ResourceID], UnsetType],
        Meta(description="Filter by list of IDs"),
    ] = UNSET

    cls: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by exact type"),
    ] = UNSET

    cls__eq: Annotated[
        Union[str, UnsetType],
        Meta(description="Use `cls` instead"),
        DEPRECATED,
    ] = UNSET

    cls__like: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by type pattern with case sensitivity"),
        DEPRECATED,
    ] = UNSET

    cls__ilike: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by type pattern without case sensitivity"),
        DEPRECATED,
    ] = UNSET

    cls__in: Annotated[
        Union[List[str], UnsetType],
        Meta(description="Filter by list of types"),
    ] = UNSET

    parent: Annotated[
        Union["ResourceID", UnsetType],
        Meta(description="Filter by exact parent ID"),
    ] = UNSET

    parent__in: Annotated[
        Union[List["ResourceID"], UnsetType],
        Meta(description="Filter by list of parent IDs"),
    ] = UNSET

    parent_id: Annotated[
        Union["ResourceID", UnsetType],
        Meta(description="Use `parent` instead"),
        DEPRECATED,
    ] = UNSET

    parent_id__eq: Annotated[
        Union["ResourceID", UnsetType],
        Meta(description="Use `parent` instead"),
        DEPRECATED,
    ] = UNSET

    parent_id__in: Annotated[
        Union[List["ResourceID"], UnsetType],
        Meta(description="Use `parent__in` instead"),
        DEPRECATED,
    ] = UNSET

    keyname: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by exact keyname"),
    ] = UNSET

    keyname__eq: Annotated[
        Union[str, UnsetType],
        Meta(description="Use `keyname` instead"),
        DEPRECATED,
    ] = UNSET

    keyname__in: Annotated[
        Union[List[str], UnsetType],
        Meta(description="Filter by list of keynames"),
    ] = UNSET

    display_name: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by exact display name"),
    ] = UNSET

    display_name__eq: Annotated[
        Union[str, UnsetType],
        Meta(description="Use `display_name` instead"),
        DEPRECATED,
    ] = UNSET

    display_name__like: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by display name pattern with case sensitivity"),
    ] = UNSET

    display_name__ilike: Annotated[
        Union[str, UnsetType],
        Meta(description="Filter by display name pattern without case sensitivity"),
    ] = UNSET

    display_name__in: Annotated[
        Union[List[str], UnsetType],
        Meta(description="Filter by list of display names"),
    ] = UNSET

    owner_user: Annotated[
        Union[UserID, UnsetType],
        Meta(description="Filter by owner user ID"),
    ] = UNSET

    owner_user__in: Annotated[
        Union[List[UserID], UnsetType],
        Meta(description="Filter by list of owner user IDs"),
    ] = UNSET

    owner_user_id: Annotated[
        Union[UserID, UnsetType],
        Meta(description="Use `owner_user` instead"),
        DEPRECATED,
    ] = UNSET

    owner_user_id__eq: Annotated[
        Union[UserID, UnsetType],
        Meta(description="Use `owner_user` instead"),
        DEPRECATED,
    ] = UNSET

    owner_user_id__in: Annotated[
        Union[List[UserID], UnsetType],
        Meta(description="Use `owner_user__in` instead"),
        DEPRECATED,
    ] = UNSET

    ats: ClassVar[Dict[str, Any]] = {
        "id": Resource.id,
        "cls": Resource.cls,
        "parent": Resource.parent_id,
        "keyname": Resource.keyname,
        "display_name": Resource.display_name,
        "owner_user": Resource.owner_user_id,
        # DEPRECATED
        "parent_id": Resource.parent_id,
        "owner_user_id": Resource.owner_user_id,
    }

    ops: ClassVar[Dict[str, Any]] = {
        "": eq_op,
        "eq": eq_op,
        "like": like_op,
        "ilike": ilike_op,
        "in": lambda a, b: in_op(a, tuple(b)),
    }

    def filters(self):
        ats = self.ats
        ops = self.ops
        for k, v in to_builtins(self).items():
            s = k.split("__", maxsplit=1)
            if len(s) == 1:
                s = (*s, "")
            yield ops[s[1]](ats[s[0]], v)


class SearchResmetaParams(Struct, kw_only=True):
    has: Annotated[
        Dict[str, bool],
        Meta(
            description="Filter by the presence of metadata keys\n\n"
            "If `true`, only resources that include the specified metadata key "
            "will be returned. If `false`, only resources that do not contain "
            "the key will be returned.",
            examples=[dict()],  # Just to stop Swagger UI make crazy defaults
        ),
    ] = field(name="resmeta__has")

    json: Annotated[
        Dict[str, str],
        Meta(
            description="Filter by metadata values\n\n"
            'Values should be JSON-encoded, e.g., `"foo"` for a string '
            "match, `42` for a number match, and `true` for a boolean match.",
            examples=[dict()],  # Just to stop Swagger UI make crazy defaults
        ),
    ] = field(name="resmeta__json")

    like: Annotated[
        Dict[str, str],
        Meta(
            description="Filter by metadata value pattern with case sensitivity",
            examples=[dict()],  # Just to stop Swagger UI make crazy defaults
        ),
    ] = field(name="resmeta__like")

    ilike: Annotated[
        Dict[str, str],
        Meta(
            description="Filter by metadata value pattern without case sensitivity",
            examples=[dict()],  # Just to stop Swagger UI make crazy defaults
        ),
    ] = field(name="resmeta__ilike")

    vdecoder: ClassVar = Decoder(Union[str, int, float, bool])

    def filters(self, id):
        from nextgisweb.resmeta.model import ResourceMetadataItem as RMI

        def _cond(k, *where):
            return exists().where(id == RMI.resource_id, RMI.key == k, *where)

        for k, v in self.has.items():
            cond = _cond(k)
            yield cond if v else ~cond

        for k, v in self.json.items():
            try:
                d = self.vdecoder.decode(v)
            except (DecodeError, MsgspecValidationError) as exc:
                raise ValidationError(message=exc.args[0])
            if isinstance(d, (int, float)):
                vfilter = sa_or(RMI.vinteger == d, RMI.vfloat == d)
            elif isinstance(d, bool):
                vfilter = RMI.vboolean == d
            elif isinstance(d, str):
                vfilter = RMI.vtext == d
            else:
                raise NotImplementedError
            yield _cond(k, vfilter)

        for o, c in (
            ("like", like_op),
            ("ilike", ilike_op),
        ):
            d = getattr(self, o)
            for k, v in d.items():
                yield _cond(k, c(RMI.vtext, v))


def search(
    request,
    *,
    serialization: Annotated[
        Literal["resource", "full"],
        Meta(
            description="Resource serialization mode\n\n"
            "If set to `full`, all resource keys are returned, but this is "
            "significantly slower. Otherwise, only the `resource` key is serialized."
        ),
    ] = "resource",
    root: Annotated[SearchRootParams, Query(spread=True)],
    attrs: Annotated[SearchAttrParams, Query(spread=True)],
    resmeta: Annotated[SearchResmetaParams, Query(spread=True)],
) -> AsJSON[List[CompositeRead]]:
    """Search resources"""

    query = root.query()
    query = query.where(*attrs.filters(), *resmeta.filters(Resource.id))
    query = query.order_by(Resource.display_name)

    cs_keys = None if serialization == "full" else ("resource",)
    serializer = CompositeSerializer(keys=cs_keys, user=request.user)
    check_perm = lambda res, u=request.user: res.has_permission(ResourceScope.read, u)
    return [
        serializer.serialize(res, CompositeRead)
        for (res,) in DBSession.execute(query)
        if check_perm(res)
    ]


class ResourceVolume(Struct, kw_only=True):
    volume: Annotated[int, Meta(ge=0, description="Resource volume in bytes")]


def resource_volume(
    resource,
    request,
    *,
    recursive: Annotated[bool, Meta(description="Include children resources")] = True,
) -> ResourceVolume:
    """Get resource data volume"""
    require_storage_enabled()

    def _traverse(res):
        request.resource_permission(ResourceScope.read, res)
        yield res.id
        if recursive:
            for child in res.children:
                yield from _traverse(child)

    try:
        ids = list(_traverse(resource))
    except InsufficientPermissions:
        volume = 0
    else:
        res = request.env.core.query_storage(dict(resource_id=lambda col: col.in_(ids)))
        volume = res.get("", dict()).get("data_volume", 0)
        volume = volume if volume is not None else 0

    return ResourceVolume(volume=volume)


QuotaCheckBody = Annotated[
    Dict[
        Annotated[ResourceCls, Meta(examples=["webmap"])],
        Annotated[int, Meta(ge=0, examples=[1])],
    ],
    TSExport("QuotaCheckBody"),
]


class QuotaCheckSuccess(Struct, kw_only=True):
    success: Annotated[bool, Meta(examples=[True])]


class QuotaCheckFailure(Struct, kw_only=True):
    cls: Union[str, None]
    required: int
    available: int
    message: str


def quota_check(
    request,
    body: AsJSON[QuotaCheckBody],
) -> AnyOf[
    Annotated[QuotaCheckSuccess, StatusCode.OK],
    Annotated[QuotaCheckFailure, StatusCode(cast(int, QuotaExceeded.http_status_code))],
]:
    """Check for resource quota"""
    try:
        request.env.resource.quota_check(body)
    except QuotaExceeded as exc:
        request.response.status_code = exc.http_status_code
        return QuotaCheckFailure(**exc.data, message=request.translate(exc.message))
    return QuotaCheckSuccess(success=True)


WidgetOperation = Annotated[Literal["create", "update", "delete", "read"], Meta(description="")]


class ResourceWidget(Struct, kw_only=True):
    operation: Annotated[WidgetOperation, Meta(description="Operation type")]
    config: Annotated[Dict[str, dict], Meta(description="Widget configuration")]
    id: Annotated[Union[int, None], Meta(description="Resource ID")]
    cls: Annotated[ResourceCls, Meta(description="Resource class identifier")]
    parent: Annotated[Union[int, None], Meta(description="Parent resource ID")]
    owner_user: Annotated[int, Meta(description="Owner user ID")]
    suggested_display_name: Annotated[Union[str, None], Meta(description="Suggested display name")]


def widget(
    request,
    *,
    operation: Union[WidgetOperation, None] = None,
    id: Annotated[Union[int, None], Meta(description="Resource ID")] = None,
    cls: Annotated[Union[ResourceCls, None], Meta(description="Resource class")] = None,
    parent: Annotated[Union[int, None], Meta(description="Parent resource ID")] = None,
) -> ResourceWidget:
    resid = id
    clsid = cls
    parent_id = parent
    suggested_display_name = None

    if operation == "create":
        if resid is not None or clsid is None or parent_id is None:
            raise HTTPBadRequest()

        if clsid not in Resource.registry._dict:
            raise HTTPBadRequest()

        parent = with_polymorphic(Resource, "*").filter_by(id=parent_id).one()
        owner_user = request.user

        tr = request.localizer.translate
        obj = Resource.registry[clsid](parent=parent, owner_user=request.user)
        suggested_display_name = obj.suggest_display_name(tr)

    elif operation in ("update", "delete"):
        if resid is None or clsid is not None or parent_id is not None:
            raise HTTPBadRequest()

        obj = with_polymorphic(Resource, "*").filter_by(id=resid).one()

        clsid = obj.cls
        parent = obj.parent
        owner_user = obj.owner_user

    else:
        raise HTTPBadRequest()

    widget = CompositeWidget(operation=operation, obj=obj, request=request)
    return ResourceWidget(
        operation=operation,
        config=widget.config(),
        id=resid,
        cls=clsid,
        parent=parent.id if parent else None,
        owner_user=owner_user.id,
        suggested_display_name=suggested_display_name,
    )


# Component settings

ResourceExport = Annotated[
    Literal["data_read", "data_write", "administrators"],
    TSExport("ResourceExport"),
]
csetting("resource_export", ResourceExport, default="data_read")


def tbl_res(request) -> JSONType:
    clsItems = ["nogeom_layer", "postgis_layer", "vector_layer"];
    query = DBSession.query(Resource).filter(Resource.cls.in_(clsItems)).all()
    result = list()
    for resource in query:
        if resource.has_permission(ResourceScope.read, request.user):
            fields=list()
            for idx in resource.fields:
                fields.append({"value": idx.keyname, "label": idx.display_name})
            result.append(dict(
                id=resource.id,
                name=resource.display_name,
                column_key=resource.column_key,
                column_constraint=resource.column_constraint,
                column_from_const=resource.column_from_const,
                fields=fields
            ))
    return result


def wmg_item_create(request) -> JSONType:
    request.resource_permission(ResourceScope.update)
    resource_id = int(request.matchdict["id"])
    webmap_group_id = int(request.matchdict["webmap_group_id"])

    try:
        query = WebMapGroupResource(resource_id=resource_id, webmap_group_id=webmap_group_id)
        DBSession.add(query)   
        DBSession.flush()
    except SQLAlchemyError as exc:
        raise ExternalDatabaseError(message=gettext("ERROR: Error not create."), sa_error=exc)


def wmg_item_update(request) -> JSONType:
    request.require_administrator()
    id = int(request.matchdict["id"])
    id_pos = int(request.matchdict["id_pos"])
    def update(id, id_pos):
        wmg_resource = DBSession.query(WebMapGroupResource).filter(WebMapGroupResource.id == id).one()
        wmg_resource.id_pos = id_pos

    with DBSession.no_autoflush:
        update(id, id_pos)
    DBSession.flush()
    return(dict(id=id, id_pos=id_pos))


def wmg_item_delete(request) -> JSONType:
    request.resource_permission(ResourceScope.update)
    resource_id = int(request.matchdict["id"])
    webmap_group_id = int(request.matchdict["webmap_group_id"])

    def delete(resource_id, webmap_group_id):
        try:
            query = WebMapGroupResource.filter_by(resource_id=resource_id, webmap_group_id=webmap_group_id).one()
            DBSession.delete(query)
            DBSession.flush()
        except SQLAlchemyError as exc:
            raise ExternalDatabaseError(message=gettext("ERROR: Error not delete."), sa_error=exc)

    with DBSession.no_autoflush:
        delete(resource_id, webmap_group_id)
    
    return dict(resource_id=resource_id, webmap_group_id=webmap_group_id)


def wmg_item_delete_all(request) -> JSONType:
    request.resource_permission(ResourceScope.update)
    DBSession.query(WebMapGroupResource).filter_by(resource_id=request.context.id).delete()
    DBSession.flush()
    return None


def wmgroup_update(request) -> JSONType:
    request.require_administrator()
    wmg_id = int(request.matchdict["id"])
    wmg_value = str(request.matchdict["wmg"]).strip()
    action_map_value = request.matchdict["action"]
    if wmg_value and wmg_value != "":
        def update(wmg_id, wmg_value, action_map_value):
            if wmg_id != 0:
                resource_wmg = DBSession.query(ResourceWebMapGroup).filter(ResourceWebMapGroup.id == wmg_id).one()
                resource_wmg.webmap_group_name = wmg_value
                resource_wmg.action_map = eval(action_map_value.lower().capitalize())
            else:
                raise HierarchyError("Имя корневой группы с идентификатором %s изменять запрещено." % wmg_id)
        with DBSession.no_autoflush:
            update(wmg_id, wmg_value, action_map_value)
        DBSession.flush()
        return dict(webmap_group_name=wmg_value, action_map=action_map_value)
    else:
        raise HierarchyError("Введено некорректное имя группы")


def wmgroup_update_position(request) -> JSONType:
    request.require_administrator()
    id = int(request.matchdict["id"])
    id_pos = int(request.matchdict["id_pos"])
    def update(id, id_pos):
        resource_wmg = DBSession.query(ResourceWebMapGroup).filter(ResourceWebMapGroup.id == id).one()
        resource_wmg.id_pos = id_pos
    with DBSession.no_autoflush:
        update(id, id_pos)
    DBSession.flush()
    return(dict(id=id, id_pos=id_pos))


def wmgroup_delete(request) -> JSONType:
    request.require_administrator()
    wmg_id = int(request.matchdict["id"])
    def delete(wmg_id):
        try:
            query = ResourceWebMapGroup.filter_by(id=wmg_id).one()
            DBSession.delete(query)
            DBSession.flush()
            
        except IntegrityError as exc:
            raise ExternalDatabaseError(message="ОШИБКА:  UPDATE или DELETE в таблице 'resource_wmg' нарушает ограничение внешнего ключа 'webmap_group_id_fkey' таблицы 'resource' DETAIL:  На ключ (id)=(%s) всё ещё есть ссылки в таблице 'resource'." % wmg_id, sa_error=exc)

    if wmg_id == 0:
        raise HierarchyError(gettext("Root resource could not be deleted."))

    with DBSession.no_autoflush:
        delete(wmg_id)
    
    return dict(id=wmg_id)


def wmgroup_create(request) -> JSONType:
    request.require_administrator()
    webmap_group_name = request.json["webmap_group_name"].strip()
    action_map = request.json["action_map"]
    if webmap_group_name:
        try:
            query = ResourceWebMapGroup(webmap_group_name=webmap_group_name, action_map=action_map)
            DBSession.add(query)   
            DBSession.flush()
        except SQLAlchemyError as exc:
            raise ExternalDatabaseError(message=gettext("ERROR: duplicate key violates unique constraint."), sa_error=exc)


def getWebmapGroup(request) -> JSONType:
    query = DBSession.query(ResourceWebMapGroup)
    result = list()
    for resource_wmg in query:
        if resource_wmg.action_map:
            result.append(
                dict(
                    id=resource_wmg.id,
                    webmap_group_name=resource_wmg.webmap_group_name,
                    action_map=resource_wmg.action_map,
                    id_pos=resource_wmg.id_pos
                )
            )
    return result


def getMaplist(request) -> JSONType:
    query = DBSession.query(Resource, ResourceWebMapGroup, WebMapGroupResource, ResourceSocial) \
        .join(WebMapGroupResource, Resource.id == WebMapGroupResource.resource_id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .outerjoin(ResourceSocial, Resource.id == ResourceSocial.resource_id)

    result = list()
    for res, res_wmg, wmg, res_social in query:
        action_map = res_wmg.action_map
        if res_wmg.id != 0:
            if res.has_permission(ResourceScope.read, request.user):
                result.append(dict(id=res.id, value=res.id, owner=True, display_name=res.display_name, label=res.display_name,
                description_status=False if res.description == None else True,
                webmap_group_name=res_wmg.webmap_group_name, webmap_group_id=wmg.webmap_group_id,
                idx=wmg.id,
                id_pos=wmg.id_pos,
                action_map=res_wmg.action_map,
                preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
                preview_description=None if res_social == None else res_social.preview_description))

    is_adm = request.user.is_administrator

    return dict(scope=is_adm, result=result)


def webmap_group_item(request) -> JSONType:
    id = int(request.matchdict["id"])

    query = DBSession.query(WebMapGroupResource, Resource, ResourceWebMapGroup, ResourceSocial).filter_by(webmap_group_id=id) \
        .join(Resource, WebMapGroupResource.resource_id == Resource.id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .outerjoin(ResourceSocial, Resource.id == ResourceSocial.resource_id)

    result = list()
    for wmg, res, res_wmg, res_social in query:
        action_map = res_wmg.action_map
        if res.has_permission(ResourceScope.read, request.user):
            result.append(dict(wmg_id=wmg.webmap_group_id,
            webmap_group_name=res_wmg.webmap_group_name, action_map=res_wmg.action_map,
            owner=True, id=res.id, value=res.id, display_name=res.display_name, label=res.display_name,
            preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
            preview_description=None if res_social == None else res_social.preview_description))

    return result


def webmap_item(request) -> JSONType:
    id = int(request.matchdict["id"])

    query = DBSession.query(WebMapGroupResource, Resource, ResourceWebMapGroup, ResourceSocial).filter_by(resource_id=id) \
        .join(Resource, WebMapGroupResource.resource_id == Resource.id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .outerjoin(ResourceSocial, Resource.id == ResourceSocial.resource_id)

    result = list()
    for wmg, res, res_wmg, res_social in query:
        action_map = res_wmg.action_map
        if res.has_permission(ResourceScope.read, request.user):
            result.append(dict(wmg_id=wmg.webmap_group_id,
            webmap_group_name=res_wmg.webmap_group_name, action_map=res_wmg.action_map,
            owner=True, id=res.id, value=res.id, display_name=res.display_name, label=res.display_name,
            preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
            preview_description=None if res_social == None else res_social.preview_description))
        if not res.has_permission(ResourceScope.read, request.user) and action_map == True:
            result.append(dict(wmg_id=wmg.webmap_group_id,
            webmap_group_name=res_wmg.webmap_group_name, action_map=res_wmg.action_map,
            owner=False, id=res.id, value=res.id, display_name=res.display_name, label=res.display_name,
            preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
            preview_description=None if res_social == None else res_social.preview_description))
    return result


def setup_pyramid(comp, config):
    config.add_route(
        "resource.blueprint",
        "/api/component/resource/blueprint",
        load_types=True,
        get=blueprint,
    )

    config.add_route(
        "resource.item",
        "/api/resource/{id}",
        factory=resource_factory,
        get=item_get,
        put=item_put,
        delete=item_delete,
    )

    config.add_route(
        "resource.collection",
        "/api/resource/",
        get=collection_get,
        post=collection_post,
    )

    config.add_route(
        "resource.items.delete",
        "/api/resource/delete",
        get=delete_get,
        post=delete_post,
    )

    config.add_route(
        "resource.permission",
        "/api/resource/{id}/permission",
        factory=resource_factory,
        get=permission,
    )

    config.add_route(
        "resource.permission.explain",
        "/api/resource/{id}/permission/explain",
        factory=resource_factory,
        get=permission_explain,
    )

    config.add_route(
        "resource.volume",
        "/api/resource/{id}/volume",
        factory=resource_factory,
        get=resource_volume,
    )

    config.add_route(
        "resource.search",
        "/api/resource/search/",
        get=search,
    )

    config.add_route(
        "resource.quota_check",
        "/api/component/resource/check_quota",
        post=quota_check,
    )

    from .favorite import api as favorite_api

    favorite_api.setup_pyramid(comp, config)

    # Overloaded routes

    config.add_route(
        "resource.export",
        "/api/resource/{id}/export",
        factory=resource_factory,
        overloaded=True,
    )

    config.add_route(
        "resource.file_download",
        "/api/resource/{id}/file/{name:any}",
        factory=resource_factory,
        overloaded=True,
    )

    config.add_route("resource.widget", "/api/resource/widget", get=widget)

    config.add_route(
        "resource.tbl_res",
        "/api/resource/tblres/",
        get=tbl_res,
    )

    config.add_route(
        "wmgroup.create",
        "/api/wmg/create/{id:uint}/{webmap_group_id:uint}/",
        factory=resource_factory,
        get=wmg_item_create,
    )

    config.add_route(
        "wmgroup.update",
        "/api/wmg/update/{id:uint}/{id_pos:uint}/",
        get=wmg_item_update,
    )

    config.add_route(
        "wmgroup.delete",
        "/api/wmg/delete/{id:uint}/{webmap_group_id:uint}/",
        factory=resource_factory,
        get=wmg_item_delete,
    )

    config.add_route(
        "wmgroup.delete_all",
        "/api/wmg/delete_all/{id:uint}",
        factory=resource_factory,
        get=wmg_item_delete_all,
    )

    config.add_route(
        "resource.wmgroup.update",
        "/api/wmgroup/update/{id:uint}/{wmg:str}/{action:str}/",
        get=wmgroup_update,
    )

    config.add_route(
        "resource.wmgroup.update_position",
        "/api/wmgroup/update_position/{id:uint}/{id_pos:uint}/",
        get=wmgroup_update_position,
    )

    config.add_route(
        "resource.wmgroup.delete",
        r"/api/wmgroup/delete/{id:uint}/",
        get=wmgroup_delete,
    )

    config.add_route(
        "resource.wmgroup_create",
        "/api/wmgroup/create",
        put=wmgroup_create,
    )

    config.add_route(
        "resource.mapgroup",
        "/api/resource/mapgroup/",
        get=getWebmapGroup,
    )

    config.add_route(
        "resource.maplist",
        "/api/resource/maplist/",
        get=getMaplist,
    )

    config.add_route(
        "resource.webmap_group_item",
        "/wmgroup/{id:uint}",
        get=webmap_group_item,
    )