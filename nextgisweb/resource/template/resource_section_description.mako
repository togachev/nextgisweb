<%!
    from nextgisweb.resource import DataScope
%>

<%page args="section" />
<%namespace file="nextgisweb:pyramid/template/clean.mako" import="clean_html"/>

%if obj.description is None:
    <p class="empty"><i>${tr(gettext("Resource description is empty."))}</i></p>
%else:
    ## ${ obj.description | clean_html, n }
    <span id="desc-data"></span>
%endif

<%
    permission = obj.has_permission(DataScope.read, request.user)
%>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/description",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        
        var props = ${
            json_js(dict(
                content = obj.description,
                permission = permission,
            )),
        };

        reactApp.default(
            comp.default,
            props,
            document.getElementById("desc-data")
        );
    });
</script>