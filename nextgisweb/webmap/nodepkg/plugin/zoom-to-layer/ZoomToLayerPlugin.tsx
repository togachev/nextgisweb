import { errorModal } from "@nextgisweb/gui/error";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { TreeLayerStore } from "@nextgisweb/webmap/store/tree-store/TreeItemStore";
import type { PluginState } from "@nextgisweb/webmap/type";
import { PluginBase } from "../PluginBase";

import Icon from "@nextgisweb/icon/material/zoom_in_map";

export class ZoomToLayerPlugin extends PluginBase {
    getPluginState(nodeData: TreeLayerStore): PluginState {
        const state = super.getPluginState(nodeData);

        return {
            ...state,
            enabled: !!(nodeData.layerHighligh),
        };
    }
    async run(nodeData: TreeLayerStore): Promise<undefined> {
        this.zoomToLayer(nodeData);
        return;
    }

    getMenuItem(nodeData: TreeLayerStore) {
        return {
            icon: <Icon />,
            title: gettext("Zoom to layer"),
            onClick: () => {
                this.run(nodeData);
            },
        };
    }

    private async zoomToLayer(item: TreeLayerStore): Promise<void> {
        if (item && item.isLayer()) {
            try {
                const { extent } = await route("layer.extent", {
                    id: item.styleId,
                }).get({ cache: true });

                this.display.map.zoomToNgwExtent(extent, {
                    displayProjection: this.display.displayProjection,
                });
            } catch (err) {
                errorModal(err);
            }
        }
    }
}
