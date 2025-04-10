<%!
    from nextgisweb.resource import ResourceScope
    from nextgisweb.gui.view import REACT_BOOT_JSENTRY
    from nextgisweb.feature_layer.view import FIELDS_RESOURCE_JSENTRY
%>

<%page args="section" />
<% section.content_box = False %>

<span id="fields-view"></span>

<%
    data = list()
    fields = [field for field in obj.fields]
    for item in fields:
        idata = dict(
            id=item.id,
            feature_label_field_id=obj.feature_label_field_id,
            keyname=item.keyname,
            datatype=item.datatype,
            display_name=item.display_name,
            lookup_table=dict(id=item.lookup_table.id) if item.lookup_table is not None else None,
            grid_visibility=True if item.grid_visibility else False,
            format_field=item.format_field,
        )
        data.append(idata)
%>

<script type="text/javascript">
    ngwEntry(${json_js(REACT_BOOT_JSENTRY)}).then(({ default: reactBoot}) => {
        reactBoot(
            ${json_js(FIELDS_RESOURCE_JSENTRY)},
            ${json_js(data)},
            "fields-view"
        );
    });
</script>