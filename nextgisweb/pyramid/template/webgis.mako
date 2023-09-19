<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div class="wrapper-webgis">
    <div id="header"></div>
    <div id="content"></div>
    <div id="footer"></div>
</div>

<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/webgis",
    ], function (reactApp, webgis) {
        reactApp.default(webgis.Header, {}, document.getElementById("header"));
        reactApp.default(
            webgis.WebgisHome, {}, document.getElementById('content')
        );
        reactApp.default(
            webgis.FooterWebgis, {}, document.getElementById('footer')
        );
    });
</script>