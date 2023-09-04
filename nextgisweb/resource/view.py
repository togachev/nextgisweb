import warnings
from dataclasses import dataclass

import zope.event
from pyramid.httpexceptions import HTTPBadRequest, HTTPFound
from pyramid.threadlocal import get_current_request
from sqlalchemy.orm import joinedload, with_polymorphic
from sqlalchemy.orm.exc import NoResultFound

from nextgisweb.env import DBSession, _
from nextgisweb.lib.dynmenu import DynItem, DynMenu, Label, Link

from nextgisweb.core.exception import InsufficientPermissions
from nextgisweb.pyramid import JSONType, viewargs
from nextgisweb.pyramid.breadcrumb import Breadcrumb, breadcrumb_adapter
from nextgisweb.pyramid.psection import PageSections

from .exception import ResourceNotFound
from .extaccess import ExternalAccessLink
from .model import Resource
from .permission import Permission, Scope
from .scope import ResourceScope
from .widget import CompositeWidget

__all__ = ['resource_factory', ]

PERM_CREATE = ResourceScope.create
PERM_READ = ResourceScope.read
PERM_UPDATE = ResourceScope.update
PERM_DELETE = ResourceScope.delete
PERM_CPERMISSIONS = ResourceScope.change_permissions
PERM_MCHILDREN = ResourceScope.manage_children


def resource_factory(request):
    # TODO: We'd like to use first key, but can't
    # as matchdiсt doesn't save keys order.

    if request.matchdict['id'] == '-':
        return None

    # First, load base class resource
    res_id = int(request.matchdict['id'])

    try:
        res_cls, = DBSession.query(Resource.cls).where(
            Resource.id == res_id).one()
    except NoResultFound:
        raise ResourceNotFound(res_id)

    polymorphic = with_polymorphic(Resource, [Resource.registry[res_cls]])
    obj = DBSession.query(polymorphic).options(
        joinedload(polymorphic.owner_user),
        joinedload(polymorphic.parent),
    ).where(polymorphic.id == res_id).one()

    request.audit_context(res_cls, res_id)

    return obj


@breadcrumb_adapter
def resource_breadcrumb(obj, request):
    if isinstance(obj, Resource):
        return Breadcrumb(
            label=obj.display_name,
            link=request.route_url('resource.show', id=obj.id),
            icon=f'rescls-{obj.cls}',
            parent=obj.parent)


@viewargs(renderer='nextgisweb:pyramid/template/psection.mako')
def show(request):
    request.resource_permission(PERM_READ)
    return dict(obj=request.context, sections=request.context.__psection__)


def root(request):
    return HTTPFound(request.route_url('resource.show', id=0))


@viewargs(renderer='react')
def json_view(request):
    request.resource_permission(PERM_READ)
    return dict(
        entrypoint='@nextgisweb/resource/json-view',
        props=dict(id=request.context.id),
        title=_("JSON view"),
        obj=request.context,
        maxheight=True,
    )


@viewargs(renderer='react')
def effective_permisssions(request):
    request.resource_permission(PERM_READ)
    return dict(
        entrypoint='@nextgisweb/resource/effective-permissions',
        props=dict(resourceId=request.context.id),
        title=_("User permissions"),
        obj=request.context,
    )


# TODO: Move to API
def schema(request) -> JSONType:
    resources = dict()
    scopes = dict()

    for identity, cls in Resource.registry.items():
        resources[identity] = dict(
            identity=identity,
            label=request.localizer.translate(cls.cls_display_name),
            scopes=list(cls.scope.keys()))

    for k, scp in Scope.registry.items():
        spermissions = dict()
        for p in scp.values():
            spermissions[p.name] = dict(
                label=request.localizer.translate(p.label))

        scopes[k] = dict(
            identity=k, permissions=spermissions,
            label=request.localizer.translate(scp.label))

    return dict(resources=resources, scopes=scopes)


@dataclass
class OnResourceCreateView:
    cls: str
    parent: Resource


@viewargs(renderer='composite_widget.mako')
def create(request):
    request.resource_permission(PERM_MCHILDREN)
    cls = request.GET.get('cls')
    zope.event.notify(OnResourceCreateView(cls=cls, parent=request.context))
    return dict(obj=request.context, title=_("Create resource"), maxheight=True,
                query=dict(operation='create', cls=cls, parent=request.context.id))


@viewargs(renderer='composite_widget.mako')
def update(request):
    request.resource_permission(PERM_UPDATE)
    return dict(obj=request.context, title=_("Update resource"), maxheight=True,
                query=dict(operation='update', id=request.context.id))


@viewargs(renderer='react')
def delete(request):
    request.resource_permission(PERM_READ)
    return dict(
        entrypoint='@nextgisweb/resource/delete-page',
        props=dict(id=request.context.id),
        title=_("Delete resource"),
        obj=request.context,
        maxheight=True,
    )


def widget(request) -> JSONType:
    operation = request.GET.get('operation', None)
    resid = request.GET.get('id', None)
    clsid = request.GET.get('cls', None)
    parent_id = request.GET.get('parent', None)
    suggested_display_name = None

    if operation == 'create':
        if resid is not None or clsid is None or parent_id is None:
            raise HTTPBadRequest()

        if clsid not in Resource.registry._dict:
            raise HTTPBadRequest()

        parent = with_polymorphic(Resource, '*') \
            .filter_by(id=parent_id).one()
        owner_user = request.user

        tr = request.localizer.translate
        obj = Resource.registry[clsid](parent=parent, owner_user=request.user)
        suggested_display_name = obj.suggest_display_name(tr)

    elif operation in ('update', 'delete'):
        if resid is None or clsid is not None or parent_id is not None:
            raise HTTPBadRequest()

        obj = with_polymorphic(Resource, '*') \
            .filter_by(id=resid).one()

        clsid = obj.cls
        parent = obj.parent
        owner_user = obj.owner_user

    else:
        raise HTTPBadRequest()

    widget = CompositeWidget(operation=operation, obj=obj, request=request)
    return dict(
        operation=operation, config=widget.config(), id=resid,
        cls=clsid, parent=parent.id if parent else None, owner_user=owner_user.id,
        suggested_display_name=suggested_display_name)


@viewargs(renderer='react')
def resource_export(request):
    request.require_administrator()
    return dict(
        entrypoint='@nextgisweb/resource/export-settings',
        title=_("Resource export"),
        dynmenu=request.env.pyramid.control_panel)


resource_sections = PageSections('resource_section')

@viewargs(renderer='map_list.mako')
def map_list(request):
    return dict(
        title=_("List of maps"),
    )

@viewargs(renderer='react')
def webmap_group_data(request):
    request.require_administrator()
    result = dict(
        entrypoint='@nextgisweb/resource/webmap-group-widget',
        title=_("Groups of digital web maps"),
        dynmenu=request.env.pyramid.control_panel)
    return result

@viewargs(renderer='react')
def webmap_group_item(request):
    request.require_administrator()
    id = int(request.matchdict['id'])

    return dict(
        entrypoint='@nextgisweb/resource/webmap-group-item',
        props=dict(id=id),
        title=_("Digital web map group"),
    )

@viewargs(renderer='react')
def resource_constraint(request):
    request.resource_permission(PERM_UPDATE)

    if (request.context.column_key):
        res = Resource.filter_by(id=request.context.column_key).one()
        display_name_const = res.display_name
    else:
        display_name_const = None

    if (request.context.cls == 'postgis_layer' or request.context.cls == 'nogeom_layer'):
        connection_id = request.context.connection.id
        schema = request.context.schema
        table_name = request.context.table
    else:
        connection_id = None
        schema = None
        table_name = None
    return dict(
        entrypoint='@nextgisweb/resource/resource-constraint',
        props=dict(
            id=request.context.id,
            display_name=request.context.display_name,
            display_name_const=display_name_const,
            column_from_const=request.context.column_from_const,
            column_key=request.context.column_key,
            column_constraint=request.context.column_constraint,
            connection_id=connection_id,
            schema=schema,
            table_name=table_name,
            cls=request.context.cls,
        ),
        title=_("Setting up a connection between resources"),
        obj=request.context,
    )

def setup_pyramid(comp, config):

    def resource_permission(request, permission, resource=None):

        if isinstance(resource, Permission):
            warnings.warn(
                'Deprecated argument order for resource_permission. '
                'Use request.resource_permission(permission, resource).',
                stacklevel=2)

            permission, resource = resource, permission

        if resource is None:
            resource = request.context

        if not resource.has_permission(permission, request.user):
            raise InsufficientPermissions(
                message=_("Insufficient '%s' permission in scope '%s' on resource id = %d.") % (
                    permission.name, permission.scope.identity, resource.id
                ), data=dict(
                    resource=dict(id=resource.id),
                    permission=permission.name,
                    scope=permission.scope.identity))

    config.add_request_method(resource_permission, 'resource_permission')

    def _route(route_name, route_path, **kwargs):
        return config.add_route(
            'resource.' + route_name,
            '/resource/' + route_path,
            **kwargs)

    def _resource_route(route_name, route_path, **kwargs):
        return _route(
            route_name, route_path,
            factory=resource_factory,
            **kwargs)

    _route('schema', 'schema').add_view(schema)

    _route('root', '', get=root)

    _resource_route('show', r'{id:uint}').add_view(show)

    _resource_route('json', r'{id:uint}/json') \
        .add_view(json_view)

    _resource_route('effective_permissions', r'{id:uint}/permissions') \
        .add_view(effective_permisssions)

    _resource_route('export.page', r'{id:uint}/export', request_method='GET')

    _route('widget', 'widget').add_view(widget)

    # CRUD
    _resource_route('create', r'{id:uint}/create').add_view(create)
    _resource_route('update', r'{id:uint}/update').add_view(update)
    _resource_route('delete', r'{id:uint}/delete').add_view(delete)

    # Sections

    # TODO: Deprecate, use resource_sections directly
    Resource.__psection__ = resource_sections

    @resource_sections(priority=10)
    def resource_section_summary(obj):
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

    class ResourceMenu(DynItem):
        def build(self, args):
            permissions = args.obj.permissions(args.request.user)
            for ident, cls in Resource.registry._dict.items():
                if ident in comp.options['disabled_cls'] or comp.options['disable.' + ident]:
                    continue

                if not cls.check_parent(args.obj):
                    continue

                # Is current user has permission to manage resource children?
                if PERM_MCHILDREN not in permissions:
                    continue

                # Is current user has permission to create child resource?
                child = cls(parent=args.obj, owner_user=args.request.user)
                if not child.has_permission(PERM_CREATE, args.request.user):
                    continue

                # Workaround SAWarning: Object of type ... not in session,
                # add operation along 'Resource.children' will not proceed
                child.parent = None
                if args.obj.cls != 'nogeom_layer':
                    yield Link(
                        'create/%s' % ident,
                        cls.cls_display_name,
                        self._url(ident),
                        icon=f"rescls-{cls.identity}")

            if PERM_UPDATE in permissions:
                yield Link(
                    'operation/10-update', _("Update"),
                    lambda args: args.request.route_url(
                        'resource.update', id=args.obj.id),
                    important=True, icon='material-edit')

            if args.obj.cls in ['mapserver_style', 'qgis_vector_style', 'qgis_raster_style', 'wmsclient_layer', 'tmsclient_layer']:
                if isinstance(args.obj, Resource):
                    if PERM_UPDATE in permissions:
                        # проверка наличия маршрута-route
                        route_intr = args.request.registry.introspector.get('routes', 'file_resource.settings')
                        if route_intr:
                            yield Link(
                                'operation/0-file_resource', _("Add/remove public files"),
                                lambda args: args.request.route_url(
                                    'file_resource.settings', id=args.obj.id),
                                icon='material-attach_file')

            if args.obj.cls in ['vector_layer', 'postgis_layer', 'raster_layer', 'wmsclient_layer', 'tmsclient_layer']:
                if isinstance(args.obj, Resource):
                    if PERM_UPDATE in permissions:
                        yield Link(
                            'operation/0-resource_constraint', _("Setting up a connection between resources"),
                            lambda args: args.request.route_url(
                                'resource.resource_constraint', id=args.obj.id),
                            icon='material-schema')

            if PERM_DELETE in permissions and args.obj.id != 0 and \
                    args.obj.parent.has_permission(PERM_MCHILDREN, args.request.user):
                yield Link(
                    'operation/20-delete', _("Delete"),
                    lambda args: args.request.route_url(
                        'resource.delete', id=args.obj.id),
                    important=True, icon='material-delete_forever')

            if PERM_READ in permissions:
                yield Link(
                    'extra/json', _("JSON view"),
                    lambda args: args.request.route_url(
                        'resource.json', id=args.obj.id),
                    icon='material-data_object')

                yield Link(
                    'extra/effective-permissions', _("User permissions"),
                    lambda args: args.request.route_url(
                        'resource.effective_permissions', id=args.obj.id),
                    icon='material-key')

        def _url(self, cls):
            return lambda args: args.request.route_url(
                'resource.create', id=args.obj.id,
                _query=dict(cls=cls))

    Resource.__dynmenu__ = DynMenu(
        Label('create', _("Create resource")),
        Label('operation', _("Action")),
        Label('extra', _("Extra")),

        ResourceMenu(),
    )

    comp.env.pyramid.control_panel.add(
        Link('settings/resource_export', _("Resource export"), lambda args: (
            args.request.route_url('resource.control_panel.resource_export'))),
        Link('settings/webmap_group', _("Groups of digital web maps"), lambda args: (
            args.request.route_url('resource.webmap_group')))
        )

    config.add_route(
        'resource.control_panel.resource_export',
        '/control-panel/resource-export',
    ).add_view(resource_export)

    config.add_route(
        'resource.resource_constraint',
        '/res_const/{id:uint}/settings',
        factory=resource_factory,
        ).add_view(resource_constraint)

    config.add_route(
        'resource.webmap_group',
        '/wmgroup',
        get=webmap_group_data)

    config.add_route(
        'resource.webmap_group_item',
        '/wmgroup/{id:uint}',
        ).add_view(webmap_group_item)

    config.add_route(
        'map_list',
        '/map-list') \
        .add_view(map_list)