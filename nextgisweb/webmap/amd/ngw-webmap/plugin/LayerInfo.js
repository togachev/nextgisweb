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
            var data = nodeData.plugin[this.identity];

            return {
                enabled:
                    type === "layer" &&
                    nodeData.plugin[this.identity] &&
                    Object.values(data).length > 0,
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
            const data = nodeData.plugin[this.identity];
            let content = [];
            const vectorType = ["postgis_layer", "vector_layer"];
            if (Object.values(data).length > 0) {

                vectorType.includes(nodeData.layerCls) && data.description_layer && content.push({
                    description: data.description_layer,
                    type: "layer",
                    url: api.routeURL("resource.show", item.layerId),
                });

                data.description_style && content.push({
                    description: data.description_style,
                    type: "style",
                    url: api.routeURL("resource.show", item.styleId),
                });

                let panel = pm.getPanel(pkey);
                if (panel) {
                    if (panel.app) {
                        panel.app.update({ content });
                    } else {
                        panel.props = { content };
                    }
                } else {
                    pm.addPanels([
                        {
                            cls: reactPanel(
                                "@nextgisweb/resource/description",
                                {
                                    props: { content },
                                }
                            ),
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
