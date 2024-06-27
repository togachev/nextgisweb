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
<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/home_page",
    ], function (reactApp, home_page) {
        const config = ${json_js(config)};

        reactApp.default(
            home_page.Content, {
                onChanges: function(v, opt) {
                    window.location.href = opt.url
                },
                config
            }, document.getElementById('content')
        );
    });
</script>