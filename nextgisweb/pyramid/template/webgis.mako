<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div class="wrapper-webgis">
    <div id="header-webgis"></div>
    <div id="content-main"></div>
    <div id="footer-webgis"></div>
</div>


<script type="text/javascript">
    require([
        "@nextgisweb/resource/header-webgis",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {       
        reactApp.default(
            comp.default,
            {},
            document.getElementById('header-webgis')
        );
    });
</script>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/webgis",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        reactApp.default(
            comp.default,
            {},
            document.getElementById('content-main')
        );
    });
</script>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/footer-webgis",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {       
        reactApp.default(
            comp.default,
            {},
            document.getElementById('footer-webgis')
        );
    });
</script>