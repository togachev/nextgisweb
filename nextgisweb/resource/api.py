from typing import Dict, List

import zope.event
from msgspec import Struct
from pyramid.httpexceptions import HTTPBadRequest
from sqlalchemy.sql import exists
from sqlalchemy.sql.operators import ilike_op
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from ..postgis.exception import ExternalDatabaseError

from nextgisweb.env import DBSession, _
from nextgisweb.lib import db

from nextgisweb.auth import User
from nextgisweb.core.exception import InsufficientPermissions
from nextgisweb.pyramid import JSONType, viewargs

from .events import AfterResourceCollectionPost, AfterResourcePut
from .exception import QuotaExceeded, ResourceError, ValidationError
from .model import Resource, ResourceSerializer, ResourceWebMapGroup, WebMapGroupResource
from ..social.model import ResourceSocial
from .presolver import ExplainACLRule, ExplainDefault, ExplainRequirement, PermissionResolver
from .scope import ResourceScope, Scope
from .serialize import CompositeSerializer
from .view import resource_factory

PERM_READ = ResourceScope.read
PERM_DELETE = ResourceScope.delete
PERM_MCHILDREN = ResourceScope.manage_children
PERM_CPERM = ResourceScope.change_permissions
PERM_UPDATE = ResourceScope.update

class BlueprintResponse(Struct):
    class Resource(Struct):
        identity: str
        label: str
        base_classes: List[str]
        interfaces: List[str]
        scopes: List[str]

    resources: Dict[str, Resource]

    class Scope(Struct):
        identity: str
        label: str

        class Permission(Struct):
            identity: str
            label: str

        permissions: Dict[str, Permission]

    scopes: Dict[str, Scope]


def blueprint(request) -> BlueprintResponse:
    tr = request.localizer.translate

    SResource = BlueprintResponse.Resource

    resources = {
        identity: SResource(
            identity=identity,
            label=tr(cls.cls_display_name),
            base_classes=list(
                reversed(
                    [bc.identity for bc in cls.__mro__ if (bc != cls and issubclass(bc, Resource))]
                )
            ),
            interfaces=[i.__name__ for i in cls.implemented_interfaces()],
            scopes=list(cls.scope.keys()),
        )
        for identity, cls in Resource.registry.items()
    }

    SScope = BlueprintResponse.Scope
    SPermission = BlueprintResponse.Scope.Permission

    scopes = {
        sid: SScope(
            identity=sid,
            label=tr(scope.label),
            permissions={
                perm.name: SPermission(
                    identity=perm.name,
                    label=tr(perm.label),
                )
                for perm in scope.values()
            },
        )
        for sid, scope in Scope.registry.items()
    }

    return BlueprintResponse(resources=resources, scopes=scopes)


def item_get(context, request) -> JSONType:
    request.resource_permission(PERM_READ)

    serializer = CompositeSerializer(context, request.user)
    serializer.serialize()

    return serializer.data


def item_put(context, request) -> JSONType:
    request.resource_permission(PERM_READ)

    serializer = CompositeSerializer(context, request.user, request.json_body)
    with DBSession.no_autoflush:
        result = serializer.deserialize()

    zope.event.notify(AfterResourcePut(context, request))

    return result


def item_delete(context, request) -> JSONType:
    def delete(obj):
        request.resource_permission(PERM_DELETE, obj)
        request.resource_permission(PERM_MCHILDREN, obj)

        for chld in obj.children:
            delete(chld)

        DBSession.delete(obj)

    if context.id == 0:
        raise ResourceError(_("Root resource could not be deleted."))

    with DBSession.no_autoflush:
        delete(context)

    DBSession.flush()


def collection_get(request) -> JSONType:
    parent = request.params.get("parent")
    parent = int(parent) if parent else None

    query = (
        Resource.query()
        .filter_by(parent_id=parent)
        .order_by(Resource.display_name)
        .options(db.subqueryload(Resource.acl))
    )

    result = list()
    for resource in query:
        if resource.has_permission(PERM_READ, request.user):
            serializer = CompositeSerializer(resource, request.user)
            serializer.serialize()
            result.append(serializer.data)

    return result


def collection_post(request) -> JSONType:
    request.env.core.check_storage_limit()

    data = dict(request.json_body)

    if "resource" not in data:
        data["resource"] = dict()

    qparent = request.params.get("parent")
    if qparent is not None:
        data["resource"]["parent"] = dict(id=int(qparent))

    cls = request.params.get("cls")
    if cls is not None:
        data["resource"]["cls"] = cls

    if "parent" not in data["resource"]:
        raise ValidationError(_("Resource parent required."))

    if "cls" not in data["resource"]:
        raise ValidationError(message=_("Resource class required."))

    if data["resource"]["cls"] not in Resource.registry:
        raise ValidationError(_("Unknown resource class '%s'.") % data["resource"]["cls"])

    elif (
        data["resource"]["cls"] in request.env.resource.options["disabled_cls"]
        or request.env.resource.options["disable." + data["resource"]["cls"]]
    ):
        raise ValidationError(message=_("Resource class '%s' disabled.") % data["resource"]["cls"])

    cls = Resource.registry[data["resource"]["cls"]]
    resource = cls(owner_user=request.user)

    serializer = CompositeSerializer(resource, request.user, data)
    serializer.members["resource"].mark("cls")

    with DBSession.no_autoflush:
        serializer.deserialize()

    resource.persist()
    DBSession.flush()

    result = dict(id=resource.id)
    request.audit_context("resource", resource.id)

    # TODO: Parent is returned only for compatibility
    result["parent"] = dict(id=resource.parent.id)

    zope.event.notify(AfterResourceCollectionPost(resource, request))

    request.response.status_code = 201
    return result


def permission(resource, request) -> JSONType:
    request.resource_permission(PERM_READ)

    # In some cases it is convenient to pass empty string instead of
    # user's identifier, that's why it so tangled.

    user = request.params.get("user", "")
    user = None if user == "" else user

    if user is not None:
        # To see permissions for arbitrary user additional permissions are needed
        request.resource_permission(PERM_CPERM)
        user = User.filter_by(id=user).one()

    else:
        # If it is not set otherwise, use current user
        user = request.user

    effective = resource.permissions(user)

    result = dict()
    for k, scope in resource.scope.items():
        sres = dict()

        for perm in scope.values(ordered=True):
            sres[perm.name] = perm in effective

        result[k] = sres

    return result


def permission_explain(request) -> JSONType:
    request.resource_permission(PERM_READ)

    req_scope = request.params.get("scope")
    req_permission = request.params.get("permission")

    req_user_id = request.params.get("user")
    user = User.filter_by(id=req_user_id).one() if req_user_id is not None else request.user
    other_user = user != request.user
    if other_user:
        request.resource_permission(PERM_CPERM)

    resource = request.context

    if req_scope is not None or req_permission is not None:
        permissions = list()
        for perm in resource.class_permissions():
            if req_scope is None or perm.scope.identity == req_scope:
                if req_permission is None or perm.name == req_permission:
                    permissions.append(perm)
        if len(permissions) == 0:
            raise ValidationError(_("Permission not found"))
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
            for perm in scope.values(ordered=True):
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
                            if i_res.has_permission(PERM_READ, request.user):
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
                            if i_res is None or i_res.has_permission(PERM_READ, request.user):
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


def quota(request) -> JSONType:
    quota_limit = request.env.resource.quota_limit
    quota_resource_cls = request.env.resource.quota_resource_cls

    count = None
    if quota_limit is not None:
        query = DBSession.query(db.func.count(Resource.id))
        if quota_resource_cls is not None:
            query = query.filter(Resource.cls.in_(quota_resource_cls))

        with DBSession.no_autoflush:
            count = query.scalar()

    return dict(
        limit=quota_limit,
        resource_cls=quota_resource_cls,
        count=count,
    )


def search(request) -> JSONType:
    smap = dict(resource=ResourceSerializer, full=CompositeSerializer)

    smode = request.GET.pop("serialization", None)
    smode = smode if smode in smap else "resource"
    principal_id = request.GET.pop("owner_user__id", None)

    scls = smap.get(smode)

    query = DBSession.query(Resource)
    if "parent_id__recursive" in request.GET:
        parent_id_recursive = int(request.GET.pop("parent_id__recursive"))
        if parent_id_recursive != 0:
            rquery = (
                DBSession.query(Resource.id)
                .filter(Resource.id == int(parent_id_recursive))
                .cte(recursive=True)
            )
            rquery = rquery.union_all(
                DBSession.query(Resource.id).filter(Resource.parent_id == rquery.c.id)
            )
            query = query.filter(exists().where(Resource.id == rquery.c.id))

    def serialize(resource, user):
        serializer = scls(resource, user)
        serializer.serialize()
        data = serializer.data
        return {Resource.identity: data} if smode == "resource" else data

    filter_ = []
    for k, v in request.GET.items():
        split = k.rsplit("__", 1)
        if len(split) == 2:
            k, op = split
        else:
            op = "eq"

        if not hasattr(Resource, k):
            continue
        attr = getattr(Resource, k)
        if op == "eq":
            filter_.append(attr == v)
        elif op == "ilike":
            filter_.append(ilike_op(attr, v))
        else:
            raise ValidationError("Operator '%s' is not supported" % op)
    if len(filter_) > 0:
        query = query.filter(db.and_(*filter_))

    query = query.order_by(Resource.display_name)

    if principal_id is not None:
        owner = User.filter_by(principal_id=int(principal_id)).one()
        query = query.filter_by(owner_user=owner)

    result = list()
    for resource in query:
        if resource.has_permission(PERM_READ, request.user):
            result.append(serialize(resource, request.user))

    return result


def resource_volume(resource, request) -> JSONType:
    ids = []

    def _collect_ids(res):
        request.resource_permission(ResourceScope.read, res)
        ids.append(res.id)
        for child in res.children:
            _collect_ids(child)

    try:
        _collect_ids(resource)
    except InsufficientPermissions:
        volume = 0
    else:
        res = request.env.core.query_storage(dict(resource_id=lambda col: col.in_(ids)))
        volume = res.get("", dict()).get("data_volume", 0)
        volume = volume if volume is not None else 0

    return dict(volume=volume)


def quota_check(request) -> JSONType:
    try:
        request.env.resource.quota_check(request.json_body)
    except QuotaExceeded as exc:
        request.response.status_code = exc.http_status_code
        tr = request.localizer.translate
        return dict(exc.data, message=tr(exc.message))
    return dict(success=True)


def resource_export_get(request) -> JSONType:
    request.require_administrator()
    try:
        value = request.env.core.settings_get("resource", "resource_export")
    except KeyError:
        value = "data_read"
    return dict(resource_export=value)


def resource_export_put(request) -> JSONType:
    request.require_administrator()

    body = request.json_body
    for k, v in body.items():
        if k == "resource_export":
            if v in ("data_read", "data_write", "administrators"):
                request.env.core.settings_set("resource", "resource_export", v)
            else:
                raise HTTPBadRequest(explanation="Invalid value '%s'" % v)
        else:
            raise HTTPBadRequest(explanation="Invalid key '%s'" % k)

@viewargs(renderer='json')
def getWebmapGroup(request):
    request.require_administrator()

    query = DBSession.query(ResourceWebMapGroup)

    result = list()
    for resource_wmg in query:
        result.append(dict(
            id=resource_wmg.id,
            webmap_group_name=resource_wmg.webmap_group_name,
            action_map=resource_wmg.action_map))
                    
    return result

@viewargs(renderer='json')
def getMaplist(request):

    query = DBSession.query(Resource, ResourceWebMapGroup, WebMapGroupResource, ResourceSocial) \
        .join(WebMapGroupResource, Resource.id == WebMapGroupResource.resource_id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .outerjoin(ResourceSocial, Resource.id == ResourceSocial.resource_id)

    result = list()
    for res, res_wmg, wmg, res_social in query:
        action_map = res_wmg.action_map
        if res_wmg.id != 0:
            if res.has_permission(PERM_READ, request.user):
                result.append(dict(id=res.id, value=res.id, owner=True, display_name=res.display_name, label=res.display_name,
                webmap_group_name=res_wmg.webmap_group_name, webmap_group_id=wmg.webmap_group_id, action_map=res_wmg.action_map,
                preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
                preview_description=None if res_social == None else res_social.preview_description))
            # if not res.has_permission(PERM_READ, request.user) and action_map == True:
            #     result.append(dict(id=res.id, value=res.id, owner=False, display_name=res.display_name, label=res.display_name,
            #     webmap_group_name=res_wmg.webmap_group_name, webmap_group_id=wmg.webmap_group_id, action_map=res_wmg.action_map,
            #     preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
            #     preview_description=None if res_social == None else res_social.preview_description))
    is_adm = request.user.is_administrator

    return dict(scope=is_adm, result=result)

@viewargs(renderer='json')
def wmgroup_delete(request):
    request.require_administrator()
    wmg_id = int(request.matchdict['id'])
    def delete(wmg_id):
        try:
            query = ResourceWebMapGroup.filter_by(id=wmg_id).one()
            DBSession.delete(query)
            DBSession.flush()
            
        except IntegrityError as exc:
            raise ExternalDatabaseError(message="ОШИБКА:  UPDATE или DELETE в таблице 'resource_wmg' нарушает ограничение внешнего ключа 'webmap_group_id_fkey' таблицы 'resource' DETAIL:  На ключ (id)=(%s) всё ещё есть ссылки в таблице 'resource'." % wmg_id, sa_error=exc)

    if wmg_id == 0:
        raise ResourceError(_("Root resource could not be deleted."))

    with DBSession.no_autoflush:
        delete(wmg_id)
    
    return dict(id=wmg_id)

@viewargs(renderer='json')
def wmgroup_update(request):
    request.require_administrator()
    wmg_id = int(request.matchdict['id'])
    wmg_value = str(request.matchdict['wmg']).strip()
    action_map_value = request.matchdict['action']
    if wmg_value and wmg_value != '':
        def update(wmg_id, wmg_value, action_map_value):
            if wmg_id != 0:
                resource_wmg = DBSession.query(ResourceWebMapGroup).filter(ResourceWebMapGroup.id == wmg_id).one()
                resource_wmg.webmap_group_name = wmg_value
                resource_wmg.action_map = eval(action_map_value.lower().capitalize())
            else:
                raise ResourceError("Имя корневой группы с идентификатором %s изменять запрещено." % wmg_id)
        with DBSession.no_autoflush:
            update(wmg_id, wmg_value, action_map_value)
        DBSession.flush()
        return dict(webmap_group_name=wmg_value, action_map=action_map_value)
    else:
        raise ResourceError("Введено некорректное имя группы")

@viewargs(renderer='json')
def wmgroup_create(request):
    request.require_administrator()
    webmap_group_name = request.json['webmap_group_name'].strip()
    action_map = request.json['action_map']
    if webmap_group_name:
        try:
            query = ResourceWebMapGroup(webmap_group_name=webmap_group_name, action_map=action_map)
            DBSession.add(query)   
            DBSession.flush()
        except SQLAlchemyError as exc:
            raise ExternalDatabaseError(message=_("ERROR: duplicate key violates unique constraint."), sa_error=exc)

@viewargs(renderer='json')
def wmg_item_create(request):
    request.resource_permission(PERM_UPDATE)
    resource_id = int(request.matchdict['id'])
    webmap_group_id = int(request.matchdict['webmap_group_id'])

    try:
        query = WebMapGroupResource(resource_id=resource_id, webmap_group_id=webmap_group_id)
        DBSession.add(query)   
        DBSession.flush()
    except SQLAlchemyError as exc:
        raise ExternalDatabaseError(message=_("ERROR: Error not create."), sa_error=exc)
        
@viewargs(renderer='json')
def wmg_item_delete(request):
    request.resource_permission(PERM_UPDATE)
    resource_id = int(request.matchdict['id'])
    webmap_group_id = int(request.matchdict['webmap_group_id'])

    def delete(resource_id, webmap_group_id):
        try:
            query = WebMapGroupResource.filter_by(resource_id=resource_id, webmap_group_id=webmap_group_id).one()
            DBSession.delete(query)
            DBSession.flush()
        except SQLAlchemyError as exc:
            raise ExternalDatabaseError(message=_("ERROR: Error not delete."), sa_error=exc)

    with DBSession.no_autoflush:
        delete(resource_id, webmap_group_id)
    
    return dict(resource_id=resource_id, webmap_group_id=webmap_group_id)

@viewargs(renderer='json')
def wmg_item_delete_all(request):
    request.resource_permission(PERM_UPDATE)
    DBSession.query(WebMapGroupResource).filter_by(resource_id=request.context.id).delete()
    DBSession.flush()
    return None

@viewargs(renderer='json')
def tbl_res(request):
    clsItems = ['nogeom_layer','postgis_layer', 'vector_layer'];
    query = DBSession.query(Resource).filter(Resource.cls.in_(clsItems)).all()
    result = list()
    for resource in query:
        if resource.has_permission(PERM_READ, request.user):
            fields=list()
            for idx in resource.fields:
                fields.append({'value':idx.display_name, 'label':idx.display_name})
            result.append(dict(
                id=resource.id,
                name=resource.display_name,
                column_key=resource.column_key,
                column_constraint=resource.column_constraint,
                column_from_const=resource.column_from_const,
                fields=fields
            ))
    return result

@viewargs(renderer='json')
def webmap_group_item(request):
    id = int(request.matchdict['id'])

    query = DBSession.query(WebMapGroupResource, Resource, ResourceWebMapGroup, ResourceSocial).filter_by(webmap_group_id=id) \
        .join(Resource, WebMapGroupResource.resource_id == Resource.id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .outerjoin(ResourceSocial, Resource.id == ResourceSocial.resource_id)

    result = list()
    for wmg, res, res_wmg, res_social in query:
        action_map = res_wmg.action_map
        if res.has_permission(PERM_READ, request.user):
            result.append(dict(wmg_id=wmg.webmap_group_id,
            webmap_group_name=res_wmg.webmap_group_name, action_map=res_wmg.action_map,
            owner=True, id=res.id, value=res.id, display_name=res.display_name, label=res.display_name,
            preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
            preview_description=None if res_social == None else res_social.preview_description))
        # if not res.has_permission(PERM_READ, request.user) and action_map == True:
        #     result.append(dict(wmg_id=wmg.webmap_group_id,
        #     webmap_group_name=res_wmg.webmap_group_name, action_map=res_wmg.action_map,
        #     owner=False, id=res.id, value=res.id, display_name=res.display_name, label=res.display_name,
        #     preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
        #     preview_description=None if res_social == None else res_social.preview_description))
    return result

@viewargs(renderer='json')
def webmap_item(request):
    id = int(request.matchdict['id'])

    query = DBSession.query(WebMapGroupResource, Resource, ResourceWebMapGroup, ResourceSocial).filter_by(resource_id=id) \
        .join(Resource, WebMapGroupResource.resource_id == Resource.id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .outerjoin(ResourceSocial, Resource.id == ResourceSocial.resource_id)

    result = list()
    for wmg, res, res_wmg, res_social in query:
        action_map = res_wmg.action_map
        if res.has_permission(PERM_READ, request.user):
            result.append(dict(wmg_id=wmg.webmap_group_id,
            webmap_group_name=res_wmg.webmap_group_name, action_map=res_wmg.action_map,
            owner=True, id=res.id, value=res.id, display_name=res.display_name, label=res.display_name,
            preview_fileobj_id=None if res_social == None else res_social.preview_fileobj_id,
            preview_description=None if res_social == None else res_social.preview_description))
        if not res.has_permission(PERM_READ, request.user) and action_map == True:
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
        get=blueprint,
    )

    config.add_route(
        "resource.item",
        "/api/resource/{id:uint}",
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
        "resource.permission",
        "/api/resource/{id:uint}/permission",
        factory=resource_factory,
        get=permission,
    )

    config.add_route(
        "resource.permission.explain",
        "/api/resource/{id:uint}/permission/explain",
        factory=resource_factory,
        get=permission_explain,
    )

    config.add_route(
        "resource.volume",
        "/api/resource/{id:uint}/volume",
        factory=resource_factory,
        get=resource_volume,
    )

    config.add_route(
        "resource.quota",
        "/api/resource/quota",
        get=quota,
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

    config.add_route(
        "resource.resource_export",
        "/api/component/resource/resource_export",
        get=resource_export_get,
        put=resource_export_put,
    )

    # Overloaded routes

    config.add_route(
        "resource.export",
        "/api/resource/{id:uint}/export",
        factory=resource_factory,
        overloaded=True,
    )

    config.add_route(
        "resource.file_download",
        "/api/resource/{id:uint}/file/{name:any}",
        factory=resource_factory,
        overloaded=True)

    config.add_route(
        'resource.tbl_res',
        '/api/resource/tblres/',
        get=tbl_res)

    config.add_route(
        'wmgroup.create',
        '/api/wmg/create/{id:uint}/{webmap_group_id:uint}/',
        factory=resource_factory,
        get=wmg_item_create)

    config.add_route(
        'wmgroup.delete',
        '/api/wmg/delete/{id:uint}/{webmap_group_id:uint}/',
        factory=resource_factory,
        get=wmg_item_delete)

    config.add_route(
        'wmgroup.delete_all',
        '/api/wmg/delete_all/{id:uint}',
        factory=resource_factory,
        get=wmg_item_delete_all)

    config.add_route(
        'resource.wmgroup.update',
        '/api/wmgroup/update/{id:uint}/{wmg:str}/{action:str}/',
        get=wmgroup_update)

    config.add_route(
        'resource.wmgroup.delete',
        r'/api/wmgroup/delete/{id:uint}/',
        get=wmgroup_delete)

    config.add_route(
        'resource.wmgroup_create',
        '/api/wmgroup/create',
        put=wmgroup_create)

    config.add_route(
        'resource.mapgroup',
        '/api/resource/mapgroup/',
        get=getWebmapGroup)

    config.add_route(
        'resource.maplist',
        '/api/resource/maplist/',
        get=getMaplist)

    config.add_route(
        'resource.webmap_group_item',
        '/wmgroup/{id:uint}',
        get=webmap_group_item)

    config.add_route(
        'resource.webmap_item',
        '/webmap/{id:uint}',
        get=webmap_item)
