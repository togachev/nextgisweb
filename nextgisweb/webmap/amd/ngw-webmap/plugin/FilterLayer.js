define([
    "dojo/_base/declare",
    "./_PluginBase",
    "@nextgisweb/gui/react-app",
    "@nextgisweb/webmap/filter-layer",
    "dojo/topic",
    "@nextgisweb/pyramid/i18n!",
    "dijit/layout/TabContainer",
], function (declare, _PluginBase, reactApp, FilterLayerComp, topic, i18n, _WidgetBase) {
    return declare([_PluginBase, _WidgetBase], {
        getPluginState: function (nodeData) {
            return {
                enabled:
                    nodeData.type === "layer" && nodeData.plugin[this.identity],
            };
        },

        run: function () {
            this._runReactApp();
        },

        getMenuItem: function () {
            var plugin = this;
            return {
                icon: "material-filter_alt",
                title: i18n.gettext("Filter layer"),
                onClick: (item) => {
                    return plugin._runReactApp(item);
                },
            };
        },

        _destroyComponent: function () {
            if (this.component) {
                this.component.unmount();
            }
            this.component = null;
        },

        _runReactApp: function (item) {
            if (!this.component) {
                this.component = reactApp.default(
                    FilterLayerComp.default,
                    {
                        item: item,
                        fields: item.plugin[this.identity],
                        plugin: this,
                        topic,
                        store: this.display.webmapStore,
                    },
                    this.domNode
                );
            }
        },
    });
});