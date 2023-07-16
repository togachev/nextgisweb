<%page args="section" />
<% section.content_box = False %>
<%namespace file="nextgisweb:pyramid/template/clean.mako" import="clean_html"/>


<div class="content-box">
    %if obj.description is None:
        <p class="empty"><i>${tr(_("Resource description is empty."))}</i></p>
    %else:
        ## ${ obj.description | clean_html, n }
        <span id="desc-data"></span>
    %endif
</div>

<script type="text/javascript">
    require([
        "@nextgisweb/webmap/map-desc",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        
        var props = ${
            json_js(dict(description = obj.description,
            upath_info = request.upath_info))
        };

        reactApp.default(
            comp.default,
            props,
            document.getElementById('desc-data')
        );
    });
</script>