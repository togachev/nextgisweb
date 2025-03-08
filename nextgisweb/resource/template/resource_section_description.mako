<%!
    import nextgisweb.pyramid as m
    from nextgisweb.gui.view import REACT_BOOT_JSENTRY
    from nextgisweb.resource.view import DESCRIPTION_RESOURCE_JSENTRY
%>

<%page args="section" />
<%namespace file="nextgisweb:pyramid/template/clean.mako" import="clean_html"/>

%if obj.description is None:
    <p class="empty"><i>${tr(gettext("Resource description is empty."))}</i></p>
%else:
    ## ${ obj.description | clean_html, n }
    <span id="desc-data"></span>
%endif

<script type="text/javascript">
    Promise.all([
        ngwEntry(${json_js(REACT_BOOT_JSENTRY)}).then((m) => m.default),
        ngwEntry(${json_js(DESCRIPTION_RESOURCE_JSENTRY)}),
    ]).then(([reactBoot, {DescComponent}]) => {
        const props = ${
            json_js(dict(
                content = obj.description,
            )),
        };
        reactBoot(DescComponent, props, document.getElementById("desc-data"));
    });
</script>