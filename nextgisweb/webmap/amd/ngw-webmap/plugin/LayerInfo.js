define([
    "dojo/_base/declare",
    "./_PluginBase",
    "ngw-webmap/ui/react-panel",
    "@nextgisweb/pyramid/api",
    "@nextgisweb/pyramid/i18n!",
], function (declare, _PluginBase, reactPanel, api, { gettext }) {
    return declare([_PluginBase], {
        getPluginState: function (nodeData) {
            var type = nodeData.type;
            var data = this.display.get("itemConfig").plugin[this.identity];
            return {
                enabled:
                    type === "layer" &&
                    nodeData.plugin[this.identity] &&
                    data.description,
            };
        },

        run: function (nodeData) {
            this.openLayerInfo(nodeData);
            return Promise.resolve(undefined);
        },

        getMenuItem: function (nodeData) {
            var widget = this;
            return {
                icon: "mdi-text-long",
                title: gettext("Description"),
                onClick: function () {
                    return widget.run(nodeData);
                },
            };
        },

        openLayerInfo: function (nodeData) {
            const pm = this.display.panelsManager;
            const pkey = "resource-description";
            const item = this.display.dumpItem();
            const data = nodeData;
            if (data !== undefined) {
                const content = [];

                const writable = nodeData.plugin['ngw-webmap/plugin/LayerEditor'] &&
                    nodeData.plugin['ngw-webmap/plugin/LayerEditor'].writable

                data.descLayer && content.push({
                    description: data.descLayer,
                    cls: data.layerCls,
                    type: "layer",
                    url: api.routeURL("resource.show", data.layerId),
                    permissions: writable
                });

                data.descStyle && content.push({
                    description: data.descStyle,
                    cls: data.cls,
                    type: "style",
                    url: api.routeURL("resource.show", data.styleId),
                    permissions: writable
                });
                
                let panel = pm.getPanel(pkey);

                if (panel) {
                    if (panel.app) {
                        panel.app.update(content);
                    } else {
                        panel.props = content;
                    }
                } else {
                    const cls = reactPanel(
                        "@nextgisweb/resource/description",
                        {
                            props: { content },
                        }
                    );
                    pm.addPanels([
                        {
                            cls: cls,
                            params: {
                                title: item.label,
                                name: pkey,
                                order: 100,
                                menuIcon: "mdi-text-long",
                            },
                        },
                    ]);
                    panel = pm.getPanel(pkey);
                }
                pm.activatePanel(pkey);
            }
        },
    });
});
