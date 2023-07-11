<%inherit file='nextgisweb:pyramid/template/base.mako' />

<div id="map_list"></div>

<%

    from nextgisweb.resource.model import Resource, ResourceSerializer, ResourceWebMapGroup, WebMapGroupResource
    from nextgisweb.social.model import ResourceSocial
    from nextgisweb.models import DBSession
    from nextgisweb.resource.scope import ResourceScope
    from collections import OrderedDict

    PERM_READ = ResourceScope.read
    
    query = DBSession.query(Resource, ResourceWebMapGroup, ResourceSocial) \
        .join(WebMapGroupResource, Resource.id == WebMapGroupResource.resource_id) \
        .join(ResourceWebMapGroup, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id) \
        .join(ResourceSocial, ResourceSocial.resource_id == Resource.id)


    result = list()
    for resource, resource_webmap_group, resource_social in query:
        action_map = resource_webmap_group.action_map
        if resource_webmap_group.id != 0:
            if resource.has_permission(PERM_READ, request.user):
                result.append(OrderedDict(id=resource.id, owner=True, display_name=resource.display_name, webmap_group_name=resource_webmap_group.webmap_group_name, action_map=resource_webmap_group.action_map, preview_fileobj_id=resource_social.preview_fileobj_id, preview_description=resource_social.preview_description))
            if not resource.has_permission(PERM_READ, request.user) and action_map == True:
                result.append(OrderedDict(id=resource.id, owner=False, display_name=resource.display_name, webmap_group_name=resource_webmap_group.webmap_group_name,  action_map=resource_webmap_group.action_map, preview_fileobj_id=resource_social.preview_fileobj_id, preview_description=resource_social.preview_description))
    user = request.user.is_administrator
%>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/map_list",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        reactApp.default(
            comp.default,
            {
                data: ${json_js(dict(user=user, webmaps=result))}
            },
            document.getElementById('map_list')
        );
    });
</script>