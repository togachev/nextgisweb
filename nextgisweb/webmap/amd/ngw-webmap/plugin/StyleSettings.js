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
                    !this.display.tinyConfig && nodeData.type === "layer" && nodeData.plugin[this.identity],
            };
        },

        getMenuItem: function () {
            var widget = this;
            return {
                icon: "mdi-image-edit",
                title: gettext("Style settings"),
                onClick: (item) => {
                    window.open(api.routeURL("resource.update", { id: item.styleId }), "_blank");
                },
            };
        },
    });
});
