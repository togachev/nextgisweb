<%page args="section"/>
<% section.content_box = False %>
<%
    from nextgisweb.resource.model import ResourceWebMapGroup, WebMapGroupResource
    from nextgisweb.env import DBSession
    query = DBSession.query(ResourceWebMapGroup, WebMapGroupResource) \
        .join(WebMapGroupResource, ResourceWebMapGroup.id == WebMapGroupResource.webmap_group_id).filter(WebMapGroupResource.resource_id == request.context.id)
    group = list()
    for resource_wmg, wmg_resource in query:
        group.append(resource_wmg.webmap_group_name)
%>
<dl class="ngw-pyramid-kv ngw-resource-section">
    <dt>${tr(_("Type"))}</dt>
    <dd>${tr(obj.cls_display_name)} (${obj.cls})</dd>

    %if obj.keyname:
        <dt>${tr(_("Keyname"))}</dt>
        <dd>${obj.keyname}</dd>
    %endif

    %if hasattr(obj, 'get_info'):
        %for key, value in obj.get_info():
            <dt>${tr(key)}</dt>
            <dd>${tr(value)}</dd>
        %endfor
    %endif

    <dt>${tr(_("Owner"))}</dt>
    <dd>${obj.owner_user}</dd>


    %if len(group):
        <dt>${tr(_("Web map group"))}</dt>
        <dd>${', '.join(group)}</dd>
    %endif
</dl>     
