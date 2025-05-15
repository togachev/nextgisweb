<%!
    import nextgisweb.pyramid as m
    from nextgisweb.gui.view import REACT_BOOT_JSENTRY
    from nextgisweb.resource.view import HOME_PAGE_JSENTRY
%>
<%
    try:
        user = request.user
        is_administrator = user.is_administrator
    except Exception:
        is_administrator = False
    upath_info = request.upath_info,
    config = {
        "isAdministrator": is_administrator,
        "upath_info": upath_info,
        "type": "home_page",
    }
%>

<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div id="content" class="wrapper-home-page"></div>

<script type="text/javascript">
    Promise.all([
        ngwEntry(${json_js(REACT_BOOT_JSENTRY)}).then((m) => m.default),
        ngwEntry(${json_js(HOME_PAGE_JSENTRY)}),
    ]).then(([reactBoot, {Avatar, Menu, Content}]) => {
        const config = ${json_js(config)};
        reactBoot(Content, {
                onChanges: function(v, opt) {
                    window.location.href = opt.url
                },
                config
            }, 
            document.getElementById("content")
        );
    });
</script>