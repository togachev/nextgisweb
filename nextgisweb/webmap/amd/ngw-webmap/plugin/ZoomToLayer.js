define([
    "dojo/_base/declare",
    "./_PluginBase",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/i18n!",
], function (declare, _PluginBase, api, { gettext }) {
    return declare([_PluginBase], {
        getPluginState: function (nodeData) {
            return {
                enabled:
                    nodeData.type === "layer" && nodeData.plugin[this.identity],
            };
        },

        run: function () {
            this.zoomToLayer();
            return Promise.resolve(undefined);
        },

        getMenuItem: function () {
            var widget = this;
            return {
                icon: "material-zoom_in_map",
                title: gettext("Zoom to layer"),
                onClick: function () {
                    return widget.run();
                },
            };
        },

        zoomToLayer: function () {
            var plugin = this,
                item = this.display.dumpItem();

            api.route("layer.extent", item.styleId)
                .get()
                .then(({ extent }) => {
                    if (!extent) return;
                    plugin.display.map.zoomToNgwExtent(
                        extent,
                        plugin.display.displayProjection
                    );
                });
        },
    });
});