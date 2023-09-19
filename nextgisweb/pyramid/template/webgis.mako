<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div class="wrapper-webgis">
    <div id="header-webgis"></div>
    <div id="menu-header-button" class="menu-button">
    </div>
    <div id="content-main"></div>
    <div id="footer-webgis"></div>
</div>

<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/webgis",
    ], function (reactApp, webgis) {
        reactApp.default(
            webgis.HeaderWebgis, {}, document.getElementById('header-webgis')
        );
        reactApp.default(webgis.MenuHeader, {}, document.getElementById("menu-header-button"));
        reactApp.default(
            webgis.WebgisHome, {}, document.getElementById('content-main')
        );
        reactApp.default(
            webgis.FooterWebgis, {}, document.getElementById('footer-webgis')
        );
    });
</script>