<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div id="content" class="wrapper-web_gis"></div>
<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/web_gis",
    ], function (reactApp, web_gis) {
        reactApp.default(
            web_gis.Content, {
                onChanges: function(v, opt) {
                    window.location.href = opt.url
                }
            }, document.getElementById('content')
        );
    });
</script>