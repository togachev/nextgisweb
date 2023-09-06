<%inherit file='nextgisweb:pyramid/template/base.mako' />

<div id="webgis"></div>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/webgis",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        reactApp.default(
            comp.default,
            {},
            document.getElementById('webgis')
        );
    });
</script>