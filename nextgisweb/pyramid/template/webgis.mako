<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div class="wrapper-webgis">
    <div id="header-webgis"></div>
    <div id="content-main"></div>
    <div id="footer-webgis"></div>
</div>


<div class="header-menu">
    <div class="link-menu" id="link-menu"></div>
    <div class="webgis-avatar" id="avatar"></div>
</div>

<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/webgis",
    ], function (reactApp, webgis) {
        reactApp.default(
            webgis.HeaderWebgis, {}, document.getElementById('header-webgis')
        );
        reactApp.default(webgis.Avatar, {}, document.getElementById("avatar"));
        reactApp.default(
            webgis.WebgisHome, {}, document.getElementById('content-main')
        );
        reactApp.default(
            webgis.FooterWebgis, {}, document.getElementById('footer-webgis')
        );
    });
</script>