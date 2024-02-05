define([
    "dojo/_base/declare",
    "./_PluginBase",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/webmap/filter-layer",
    "dojo/topic",
    "@nextgisweb/pyramid/i18n!",
], function (declare, _PluginBase, reactApp, FilterLayerComp, topic, i18n) {
    return declare([_PluginBase], {
        FilterLayerCompDomNode: undefined,
        getPluginState: function (nodeData) {
            return {
                enabled:
                    nodeData.type === "layer" && nodeData.plugin[this.identity],
            };
        },

        getMenuItem: function () {
            return {
                icon: "material-filter_alt",
                title: i18n.gettext("Filter layer"),
                onClick: (item) => {
                    this.makeComp(item);
                    return Promise.resolve(undefined);
                },
            };
        },

        makeComp: function (item) {
            var display = this.display;
            if (!this.FilterLayerCompDomNode) {
                const newNode = document.createElement("div");
                newNode.classList.add("ngw-filter-layer");
                display.domNode.after(newNode);
                this.FilterLayerCompDomNode = newNode;
            }
            reactApp.default(
                FilterLayerComp.default,
                {
                    item: item,
                    plugin: this,
                    topic,
                },
                this.FilterLayerCompDomNode
            );
        },
    });
});