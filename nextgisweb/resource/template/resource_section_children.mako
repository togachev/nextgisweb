<%!
    from types import SimpleNamespace
    from nextgisweb.lib import dynmenu as dm
    from nextgisweb.resource import ResourceScope
    from nextgisweb.resource.model import Resource
%>

<%page args="section" />
<% section.content_box = False %>

<div id="childrenSection" class="ngw-resource-section ngw-card"></div>

<%
    data = list()
    for item in obj.children:
        if (getattr(item, 'column_key', None)):
            res = Resource.filter_by(id=item.column_key).one()
            column_key = item.column_key
            update_link_const = request.route_url('resource.resource_constraint', id=item.id)
            display_name_const = res.display_name
        else:
            column_key = None
            update_link_const = None
            display_name_const = None
        if ResourceScope.read not in item.permissions(request.user):
            continue
        idata = dict(
            id=item.id, displayName=item.display_name, link=request.route_url('resource.show', id=item.id),
            cls=item.cls, clsDisplayName=tr(item.cls_display_name), creationDate=item.creation_date,
            ownerUserDisplayName=tr(item.owner_user.display_name_i18n), 
            column_key=column_key, update_link_const=update_link_const,
            display_name_const=display_name_const)
        
        iacts = idata["actions"] = list()
        args = SimpleNamespace(obj=item, request=request)
        for menu_item in item.__dynmenu__.build(args):
            if isinstance(menu_item, dm.Link) and menu_item.important and menu_item.icon is not None:
                iacts.append(dict(
                    href=menu_item.url(args), target=menu_item.target,
                    title=tr(menu_item.label), icon=menu_item.icon, key=menu_item.key))

        data.append(idata)

    data.sort(key=lambda x: (0 if x['cls'] == 'resource_group' else (1 if x['cls'] == 'webmap' else 2), x['displayName']))
%>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/children-section",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        reactApp.default(
            comp.default, {
                storageEnabled: ${json_js(request.env.core.options['storage.enabled'])},
                data: ${json_js(data)},
                resourceId: ${obj.id},
            }, document.getElementById('childrenSection')
        );
    });
</script>