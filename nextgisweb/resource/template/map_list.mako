<%inherit file='nextgisweb:pyramid/template/base.mako' />

<div id="map_list"></div>

<script type="text/javascript">
    require([
        "@nextgisweb/resource/map_list",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {
        reactApp.default(
            comp.default,
            {},
            document.getElementById('map_list')
        );
    });
</script>