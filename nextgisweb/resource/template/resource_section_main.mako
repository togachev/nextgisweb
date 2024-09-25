<%! from nextgisweb.resource.view import creatable_resources %>
<%! from nextgisweb.pyramid.api import csetting %>

<%page args="section" />
<% section.content_box = False %>
<%
    from nextgisweb.resource.model import ResourceWebMapGroup, WebMapGroupResource
    from nextgisweb.env import DBSession
    query = DBSession.query(ResourceWebMapGroup, WebMapGroupResource) \
        .join(WebMapGroupResource, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id).filter(WebMapGroupResource.resource_id == request.context.id)

    props = dict(resourceId=obj.id)

    groupMap = props["groupMap"] = []
    for resource_wmg, wmg_resource in query:
        groupMap.append((tr(resource_wmg.webmap_group_name)))

    summary = props["summary"] = []
    summary.append((tr(gettext("Type")), f"{tr(obj.cls_display_name)} ({obj.cls})"))
    if keyname := obj.keyname:
        summary.append((tr(gettext("Keyname")), keyname))

    if get_info := getattr(obj, 'get_info', None):
        for key, value in get_info():
            summary.append((tr(key), str(tr(value))))

    summary.append((tr(gettext("Owner")), tr(obj.owner_user.display_name_i18n)))

    props["creatable"] = [c.identity for c in creatable_resources(obj, user=request.user)]
    props["cls"] = obj.cls
%>

<div id="resourceMainSection" class="ngw-resource-section"></div>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/main-section",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        reactApp.default(
            comp.default,
            ${json_js(props)},
            document.getElementById('resourceMainSection')
        );
    });
</script>
