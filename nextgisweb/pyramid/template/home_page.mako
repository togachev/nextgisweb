<%inherit file='nextgisweb:pyramid/template/base.mako' />
<div id="content" class="wrapper-home-page"></div>
<script>
    require([
        "@nextgisweb/gui/react-app",
        "@nextgisweb/resource/home_page",
    ], function (reactApp, home_page) {
        reactApp.default(
            home_page.Content, {
                onChanges: function(v, opt) {
                    window.location.href = opt.url
                }
            }, document.getElementById('content')
        );
    });
</script>