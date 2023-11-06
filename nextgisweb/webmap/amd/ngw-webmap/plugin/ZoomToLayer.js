define([
    "dojo/_base/declare",
    "./_PluginBase",
    "dojo/request/xhr",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/i18n!",
], function (declare, _PluginBase, xhr, api, i18n) {
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
                icon: "material-zoom_in_map-outline",
                title: i18n.gettext("Zoom to layer"),
                onClick: function () {
                    return widget.run();
                },
            };
        },

        zoomToLayer: function () {
            var plugin = this,
                item = this.display.dumpItem();

            const url = api.routeURL("layer.extent", { id: item.styleId });

            xhr.get(url, {
                handleAs: "json",
            }).then(function ({ extent }) {
                plugin.display.map.zoomToNgwExtent(
                    extent,
                    plugin.display.displayProjection
                );
            });
        },
    });
});
