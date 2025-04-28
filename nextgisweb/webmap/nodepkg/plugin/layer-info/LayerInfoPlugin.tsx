import { gettext } from "@nextgisweb/pyramid/i18n";
import type DescriptionStore from "@nextgisweb/webmap/panel/description/DescriptionStore";
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
            enabled: !!(state.enabled && data.description_layer) || !!(state.enabled && data.description_style),
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

            vectorType.includes(nodeData.layerCls) && data.description_layer && content.push({
                description: data.description_layer,
                type: "layer",
            });

            data.description_style && content.push({
                description: data.description_style,
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
        }
    }
}
