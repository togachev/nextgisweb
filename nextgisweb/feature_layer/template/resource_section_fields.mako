<%!
    from nextgisweb.resource import ResourceScope
    from nextgisweb.gui.view import REACT_BOOT_JSENTRY
    from nextgisweb.feature_layer.view import FIELDS_RESOURCE_JSENTRY
%>

<%page args="section" />
<% section.content_box = False %>

<%
    have_lookup_table = False
    for field in obj.fields:
        if field.lookup_table is not None:
            have_lookup_table = True
%>
<span id="fields-view"></span>
<table class="pure-table pure-table-horizontal ngw-card" style="width: 100%">
    <thead><tr>
        <th style="text-align: inherit; width: 20%; ">${tr(gettext("Keyname"))}</th>
        <th style="text-align: inherit; width: 20%;">${tr(gettext("Type"))}</th>
        <th style="text-align: inherit; width: 40%;">${tr(gettext("Display name"))}</th>
        %if have_lookup_table:
            <th style="text-align: center; width: 10%;">${tr(gettext("Lookup table"))}</th>
        %endif
        <th style="text-align: center; width: 20%;">${tr(gettext("Table"))}</th>
    </tr></thead>
    %if ResourceScope.read in obj.permissions(request.user):
        %for field in obj.fields:
            <tr style="${'text-decoration: underline;' if field.id == obj.feature_label_field_id else '' | n}">
                <td>${field.keyname}</td>
                <td>${field.datatype}</td>
                <td>${field.display_name}</td>
                %if have_lookup_table:
                    <td style="text-align: center;">
                    %if field.lookup_table is not None:
                        <a href="${request.route_url('resource.show', id=field.lookup_table.id)}">${tr(gettext("Yes"))}</a>
                    %else:
                        ${tr(gettext("No"))}
                    %endif
                    </td>
                %endif
                <td style="text-align: center;">${tr(gettext("Yes")) if field.grid_visibility else tr(gettext("No")) | n}</td>
            </tr>
        %endfor
    %endif
</table>

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