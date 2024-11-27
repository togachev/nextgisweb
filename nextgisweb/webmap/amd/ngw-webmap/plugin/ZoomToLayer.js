define([
    "dojo/_base/declare",
    "./_PluginBase",
    "dojo/request/xhr",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/i18n!",
], function (declare, _PluginBase, xhr, api, { gettext }) {
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
            const item = this.display.dumpItem();

            api.route("feature_layer.feature.extent", item.layerId)
                .get()
                .then((extent) => {
                    if (!extent) return;
                    this.display.map.zoomToNgwExtent(
                        extent,
                        this.display.displayProjection
                    );
                });
        },
    });
});
