<div id="footer" class="footer"></div>

<script type="text/javascript">
    require([
        "@nextgisweb/pyramid/footer",
        "@nextgisweb/gui/react-app",
    ], function (comp, reactApp) {       
        reactApp.default(
            comp.default,
            {},
            document.getElementById('footer')
        );
    });
</script>