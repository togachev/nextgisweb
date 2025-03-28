import warnings
from dataclasses import dataclass

import zope.event
import zope.event.classhandler
from msgspec import Meta
from pyramid.httpexceptions import HTTPFound
from pyramid.threadlocal import get_current_request
from sqlalchemy.orm import joinedload, with_polymorphic
from sqlalchemy.orm.exc import NoResultFound
from typing_extensions import Annotated

from nextgisweb.env import DBSession, env, gettext
from nextgisweb.lib.dynmenu import DynMenu, Label, Link

from nextgisweb.auth import OnUserLogin
from nextgisweb.core.exception import InsufficientPermissions
from nextgisweb.gui import react_renderer
from nextgisweb.jsrealm import icon, jsentry
from nextgisweb.pyramid import JSONType, viewargs
from nextgisweb.pyramid.breadcrumb import Breadcrumb, breadcrumb_adapter
from nextgisweb.pyramid.psection import PageSections

from .event import OnChildClasses, OnDeletePrompt
from .exception import ResourceNotFound
from .extaccess import ExternalAccessLink
from .interface import IResourceBase
from .model import Resource
from .permission import Permission, Scope
from .scope import ResourceScope

MAIN_SECTION_JSENTRY = jsentry("@nextgisweb/resource/main-section")
CHILDREN_SECTION_JSENTRY = jsentry("@nextgisweb/resource/children-section")
EXTERNAL_ACCESS_JSENTRY = jsentry("@nextgisweb/resource/external-access")
RESOURCE_ENTRY_JSENTRY = jsentry("@nextgisweb/resource/resources-filter")
HOME_PAGE_JSENTRY = jsentry("@nextgisweb/resource/home-page")
DESCRIPTION_RESOURCE_JSENTRY = jsentry("@nextgisweb/resource/description")
RESOURCE_TITLE_JSENTRY = jsentry("@nextgisweb/resource/resource-title")

ResourceID = Annotated[int, Meta(ge=0, description="Resource ID")]


class ResourceFactory:
    def __init__(self, *, key="id", context=None):
        self.key = key
        self.context = context

    def __call__(self, request) -> Resource:
        # First, load base class resource
        res_id = request.path_param[self.key]
        try:
            (res_cls,) = DBSession.query(Resource.cls).where(Resource.id == res_id).one()
        except NoResultFound:
            raise ResourceNotFound(res_id)

        polymorphic = with_polymorphic(Resource, [Resource.registry[res_cls]])
        obj = (
            DBSession.query(polymorphic)
            .options(
                joinedload(polymorphic.owner_user),
                joinedload(polymorphic.parent),
            )
            .where(polymorphic.id == res_id)
            .one()
        )

        if context := self.context:
            if issubclass(context, Resource):
                if not isinstance(obj, context):
                    raise ResourceNotFound(res_id)
            elif issubclass(context, IResourceBase):
                if not context.providedBy(obj):
                    raise ResourceNotFound(res_id)
            else:
                raise NotImplementedError

        request.audit_context(res_cls, res_id)

        return obj

    @property
    def annotations(self):
        if context := self.context:
            if issubclass(context, Resource):
                description = f"{context.cls_display_name} resource ID"
            elif issubclass(context, IResourceBase):
                description = f"ID of resource providing {context.__name__} interface"
            else:
                raise NotImplementedError
            tdef = Annotated[ResourceID, Meta(description=description)]
        else:
            tdef = ResourceID
        return {self.key: tdef}


resource_factory = ResourceFactory()


@breadcrumb_adapter
def resource_breadcrumb(obj, request):
    if isinstance(obj, Resource):
        return Breadcrumb(
            label=obj.display_name,
            link=request.route_url("resource.show", id=obj.id),
            icon=f"rescls-{obj.cls}",
            parent=dict(parent=obj.parent, id=obj.id),
        )


@viewargs(renderer="nextgisweb:pyramid/template/psection.mako")
def show(request):
    request.resource_permission(ResourceScope.read)
    return dict(obj=request.context, sections=request.context.__psection__)


def root(request):
    return HTTPFound(request.route_url("resource.show", id=0))


@react_renderer("@nextgisweb/resource/json-view")
def json_view(request):
    request.resource_permission(ResourceScope.read)
    return dict(
        props=dict(id=request.context.id),
        title=gettext("JSON view"),
        obj=request.context,
        maxheight=True,
    )


@react_renderer("@nextgisweb/resource/effective-permissions")
def effective_permisssions(request):
    request.resource_permission(ResourceScope.read)
    return dict(
        props=dict(resourceId=request.context.id),
        title=gettext("User permissions"),
        obj=request.context,
    )


# TODO: Move to API
def schema(request) -> JSONType:
    tr = request.translate
    resources = dict()
    scopes = dict()

    for identity, cls in Resource.registry.items():
        resources[identity] = dict(
            identity=identity,
            label=tr(cls.cls_display_name),
            scopes=list(cls.scope.keys()),
        )

    for k, scp in Scope.registry.items():
        spermissions = dict()
        for p in scp.values():
            spermissions[p.name] = dict(label=tr(p.label))

        scopes[k] = dict(
            identity=k,
            permissions=spermissions,
            label=tr(scp.label),
        )

    return dict(resources=resources, scopes=scopes)


@dataclass
class OnResourceCreateView:
    cls: str
    parent: Resource


@react_renderer("@nextgisweb/resource/composite")
def create(request):
    request.resource_permission(ResourceScope.manage_children)
    cls = request.GET.get("cls")
    zope.event.notify(OnResourceCreateView(cls=cls, parent=request.context))
    setup = dict(operation="create", cls=cls, parent=request.context.id)
    return dict(
        props=dict(setup=setup),
        obj=request.context,
        title=gettext("Create resource"),
        maxheight=True,
    )


@react_renderer("@nextgisweb/resource/composite")
def update(request):
    request.resource_permission(ResourceScope.update)
    setup = dict(operation="update", id=request.context.id)
    return dict(
        props=dict(setup=setup),
        obj=request.context,
        title=gettext("Update resource"),
        maxheight=True,
    )


@react_renderer("@nextgisweb/resource/delete-page")
def delete(request):
    request.resource_permission(ResourceScope.read)
    return dict(
        # Delete page is universal for multiple resources deletion which is why resources is an array
        props=dict(resources=[request.context.id], navigateToId=request.context.parent.id),
        title=gettext("Delete resource"),
        obj=request.context,
        maxheight=True,
    )


@react_renderer("@nextgisweb/resource/export-settings")
def resource_export(request):
    request.require_administrator()
    return dict(
        title=gettext("Resource export"),
        dynmenu=request.env.pyramid.control_panel,
    )


def creatable_resources(parent, *, user):
    result = []

    permissions = parent.permissions(user)
    if parent.cls != "tablenogeom_layer":
        if ResourceScope.manage_children not in permissions:
            return result

        disabled_resource_cls = env.resource.disabled_resource_cls

        classes = set(
            cls
            for cls in Resource.registry.values()
            if (cls.identity not in disabled_resource_cls and cls.check_parent(parent))
        )

        if len(classes) == 0:
            return result

        classes = OnChildClasses.apply(parent=parent, classes=classes)

        for cls in classes:
            # Create a temporary resource to perform the remaining checks
            # TODO: It shouldn't be added to a session! Double-check it.
            child = cls(parent=parent, owner_user=user)

            if not parent.check_child(child):
                continue

            if not child.has_permission(ResourceScope.create, user):
                continue

            # Workaround SAWarning: Object of type ... not in session,
            # add operation along 'Resource.children' will not proceed
            child.parent = None

            result.append(cls)

    return result


resource_sections = PageSections("resource_section")

@viewargs(renderer="react")
def webmap_group_data(request):
    request.require_administrator()
    result = dict(
        entrypoint="@nextgisweb/resource/webmap-group-widget",
        title=gettext("Groups of digital web maps"),
        dynmenu=request.env.pyramid.control_panel)
    return result

def setup_pyramid(comp, config):
    def resource_permission(request, permission, resource=None):
        if isinstance(resource, Permission):
            warnings.warn(
                "Deprecated argument order for resource_permission. "
                "Use request.resource_permission(permission, resource).",
                stacklevel=2,
            )

            permission, resource = resource, permission

        if resource is None:
            resource = request.context

        if not resource.has_permission(permission, request.user):
            raise InsufficientPermissions(
                message=gettext("Insufficient '%s' permission in scope '%s' on resource id = %d.")
                % (permission.name, permission.scope.identity, resource.id),
                data=dict(
                    resource=dict(id=resource.id),
                    permission=permission.name,
                    scope=permission.scope.identity,
                ),
            )

    config.add_request_method(resource_permission, "resource_permission")

    def _route(route_name, route_path, **kwargs):
        return config.add_route(
            "resource." + route_name,
            "/resource/" + route_path,
            **kwargs,
        )

    def _resource_route(route_name, route_path, **kwargs):
        return _route(
            route_name,
            route_path,
            factory=resource_factory,
            **kwargs,
        )

    _route("schema", "schema", get=schema)
    _route("root", "", get=root)

    _resource_route("show", r"{id:uint}", get=show)
    _resource_route("json", r"{id:uint}/json", get=json_view)
    _resource_route("effective_permissions", r"{id:uint}/permissions", get=effective_permisssions)
    _resource_route("export.page", r"{id:uint}/export", request_method="GET")

    config.add_route(
        "resource.control_panel.resource_export",
        "/control-panel/resource-export",
        get=resource_export,
    )

    config.add_route(
        "resource.webmap_group",
        "/wmgroup",
        get=webmap_group_data,
    )

    # CRUD
    _resource_route("create", r"{id:uint}/create", get=create)
    _resource_route("update", r"{id:uint}/update", get=update)
    _resource_route("delete", r"{id:uint}/delete", get=delete)

    # Sections

    # TODO: Deprecate, use resource_sections directly
    Resource.__psection__ = resource_sections

    @resource_sections(priority=0)
    def resource_section_main(obj):
        return True

    @resource_sections(priority=40)
    def resource_section_children(obj):
        return len(obj.children) > 0

    @resource_sections(priority=20)
    def resource_section_description(obj):
        return obj.description is not None

    @resource_sections()
    def resource_section_external_access(obj):
        items = list()
        request = get_current_request()
        for link in ExternalAccessLink.registry:
            if itm := link.factory(obj, request):
                items.append(itm)
        return dict(links=items) if len(items) > 0 else None

    # Actions
    Resource.__dynmenu__ = DynMenu(
        Label("create", gettext("Create resource")),
        Label("operation", gettext("Action")),
        Label("extra", gettext("Extra")),
    )

    icon_edit = icon("material/edit")
    icon_delete = icon("material/delete")
    icon_json = icon("material/data_object")
    icon_effective_permissions = icon("material/key")

    @Resource.__dynmenu__.add
    def _resource_dynmenu(args):
        permissions = args.obj.permissions(args.request.user)

        if ResourceScope.update in permissions:
            yield Link(
                "operation/10-update",
                gettext("Update"),
                lambda args: args.request.route_url("resource.update", id=args.obj.id),
                important=True,
                icon=icon_edit,
            )

        if args.obj.cls in ["mapserver_style", "qgis_vector_style", "qgis_raster_style", "wmsclient_layer", "tmsclient_layer"]:
            if isinstance(args.obj, Resource):
                if ResourceScope.update in permissions:
                    # проверка наличия маршрута-route
                    route_intr = args.request.registry.introspector.get("routes", "file_resource.settings")
                    if route_intr:
                        yield Link(
                            "operation/0-file_resource",
                            gettext("Add/remove public files"),
                            lambda args: args.request.route_url("file_resource.settings", id=args.obj.id),
                            icon="material-attach_file",
                        )

        if (
            ResourceScope.delete in permissions
            and args.obj.id != 0
            and args.obj.parent.has_permission(ResourceScope.manage_children, args.request.user)
            and OnDeletePrompt.apply(args.obj)
        ):
            yield Link(
                "operation/20-delete",
                gettext("Delete"),
                lambda args: args.request.route_url("resource.delete", id=args.obj.id),
                important=True,
                icon=icon_delete,
            )

        if ResourceScope.read in permissions:
            yield Link(
                "extra/json",
                gettext("JSON view"),
                lambda args: args.request.route_url("resource.json", id=args.obj.id),
                icon=icon_json,
            )

            yield Link(
                "extra/effective-permissions",
                gettext("User permissions"),
                lambda args: args.request.route_url(
                    "resource.effective_permissions",
                    id=args.obj.id,
                ),
                icon=icon_effective_permissions,
            )

    @comp.env.pyramid.control_panel.add
    def _control_panel(args):
        if args.request.user.is_administrator:
            yield Link(
                "settings/resource_export",
                gettext("Resource export"),
                lambda args: (args.request.route_url("resource.control_panel.resource_export")),
            )
        if args.request.user.is_administrator:
            yield Link(
                "settings/webmap_group",
                gettext("Groups of digital web maps"),
                lambda args: (args.request.route_url("resource.webmap_group")),
            )
    
    if comp.options["home.enabled"]:
        from .home import on_user_login

        zope.event.classhandler.handler(OnUserLogin)(on_user_login)

    from .favorite import view as favorite_view

    favorite_view.setup_pyramid(comp, config)
