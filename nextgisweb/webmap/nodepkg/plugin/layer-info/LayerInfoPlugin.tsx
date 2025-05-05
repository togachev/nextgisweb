import { gettext } from "@nextgisweb/pyramid/i18n";
import { errorModal } from "@nextgisweb/gui/error";
import type DescriptionStore from "@nextgisweb/webmap/panel/description/DescriptionStore";
import { route } from "@nextgisweb/pyramid/api";
import type { PluginState } from "@nextgisweb/webmap/type";
import type { LayerItemConfig } from "@nextgisweb/webmap/type/api";
import { PluginBase } from "../PluginBase";
import type { DescriptionWebMapPluginConfig } from "../type";

import DescriptioIcon from "@nextgisweb/icon/material/article";

interface DescriptionContentProps {
    description: string;
    type: string;
}

export class LayerInfoPlugin extends PluginBase {
    getPluginState(nodeData: LayerItemConfig): PluginState {
        const state = super.getPluginState(nodeData);
        const infoConfig = this.display.itemConfig;
        const data = infoConfig?.plugin[
            this.identity
        ] as DescriptionWebMapPluginConfig;
        return {
            ...state,
            enabled: !!(state.enabled && data.style_id) || !!(state.enabled && data.layer_id),
        };
    }

    async run(nodeData) {
        this.openLayerInfo(nodeData);
        return undefined;
    }

    getMenuItem(nodeData) {
        return {
            icon: <DescriptioIcon />,
            title: gettext("Description"),
            onClick: () => {
                return this.run(nodeData);
            },
        };
    }

    private async openLayerInfo(nodeData) {
        const pm = this.display.panelManager;
        const pkey = "info";
        const data = this.display.itemConfig?.plugin[
            this.identity
        ] as DescriptionWebMapPluginConfig;

        const content: DescriptionContentProps[] = [];
        const vectorType = ["postgis_layer", "vector_layer"];

        if (Object.values(data).length > 0) {
            const { layer_id, style_id } = data;
            try {
                const resource_layer = layer_id ? await route("resource.item", {
                    id: layer_id,
                }).get({
                    cache: true,
                    query: {
                        description: true,
                        serialization: "resource",
                    }
                }) : "";

                const resource_style = style_id ? await route("resource.item", {
                    id: style_id,
                }).get({
                    cache: true,
                    query: {
                        description: true,
                        serialization: "resource",
                    }
                }) : "";

                const description_layer = resource_layer?.resource?.description;
                const description_style = resource_style?.resource?.description;
                
                vectorType.includes(nodeData.layerCls) && description_layer && content.push({
                    description: description_layer,
                    type: "layer",
                });

                vectorType.includes(nodeData.layerCls) &&description_style && content.push({
                    description: description_style,
                    type: "style",
                });

                content.push({
                    description: this.display.config.webmapDescription,
                    type: "webmap_desc",
                });
                
                let panel = pm.getPanel<DescriptionStore>(pkey);
                if (!panel) {
                    panel = (await pm.registerPlugin(pkey)) as DescriptionStore;
                }
                if (panel) {
                    panel.setContent({ content: content, type: "map" });
                }
                pm.activatePanel(pkey);

            } catch (err) {
                errorModal(err);
            }
        }
    }
}
