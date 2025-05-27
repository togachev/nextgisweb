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

    private async loadDescripton(id, type) {
        const value = await route("resource.item", {
            id: id,
        }).get({
            cache: true,
            query: {
                description: true,
                serialization: "resource",
            }
        })
            .then(item => ({
                description: item?.resource?.description,
                type: type,
            }))
        return value;
    }

    private async openLayerInfo(nodeData) {
        const pm = this.display.panelManager;
        const pkey = "info";
        const data = this.display.itemConfig?.plugin[
            this.identity
        ] as DescriptionWebMapPluginConfig;

        const content: DescriptionContentProps[] = [];
        const vectorType = ["postgis_layer", "vector_layer", "raster_layer"];

        if (Object.values(data).length > 0) {
            const { layer_id, style_id } = data;
            try {
                vectorType.includes(nodeData.layerCls) && layer_id &&
                    await this.loadDescripton(layer_id, "layer").then(i => content.push(i));

                style_id &&
                    await this.loadDescripton(style_id, "style").then(i => content.push(i));

                this.display.config.webmapDescription &&
                    await this.loadDescripton(this.display.config.webmapId, "webmap_desc").then(i => content.push(i));

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
