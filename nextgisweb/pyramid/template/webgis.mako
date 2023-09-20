<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div id="content" class="wrapper-webgis"></div>

<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/webgis",
    ], function (reactApp, webgis) {
        reactApp.default(
            webgis.Content, {}, document.getElementById('content')
        );
    });
</script>