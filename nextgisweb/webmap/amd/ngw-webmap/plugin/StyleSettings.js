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

        getMenuItem: function () {
            var widget = this;
            return {
                icon: "material-settings_suggest",
                title: i18n.gettext("Style settings"),
                onClick: (item) => {
                    window.open(api.routeURL("resource.update", { id: item.styleId }), "_blank");
                },
            };
        },
    });
});
