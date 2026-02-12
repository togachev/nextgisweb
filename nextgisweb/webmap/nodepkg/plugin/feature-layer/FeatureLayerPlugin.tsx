import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import topic from "@nextgisweb/webmap/compat/topic";
import type { PluginState } from "@nextgisweb/webmap/type";
import type { TreeLayerStore } from "@nextgisweb/webmap/store/tree-store/TreeItemStore";

import { PluginBase } from "../PluginBase";

import TableIcon from "@nextgisweb/icon/material/table";
import OpenInNew from "@nextgisweb/icon/material/open_in_new";

export class FeatureLayerPlugin extends PluginBase {
    getPluginState(nodeData: TreeLayerStore): PluginState {
        const state = super.getPluginState(nodeData);
        const typeLayer = ["postgis_layer", "vector_layer"];

        return {
            ...state,
            enabled: !!(state.enabled && !this.display.isTinyMode && typeLayer.includes(nodeData.layerCls) && nodeData.layerHighligh),
        };
    }
    getMenuItem(nodeData: TreeLayerStore) {
        return {
            icon: <TableIcon />,
            title: gettext("Feature table"),
            onClick: () => {
                this.openFeatureGrid(nodeData);
                return Promise.resolve(undefined);
            },
            extra:
                <span
                    className="show-resource"
                    title={gettext("Open table in new page")}
                    onClick={() => {
                        window.open(routeURL("feature_layer.feature.browse", { id: nodeData.layerId }), "_blank");
                    }}
                >
                    <OpenInNew />
                </span >,
        };
    }

    private openFeatureGrid(item: TreeLayerStore) {
        if (item?.isLayer()) {
            this.display.tabsManager.addTab({
                key: String(item.styleId),
                label: item.label,
                component: () =>
                    import("@nextgisweb/webmap/webmap-feature-grid-tab"),
                props: {
                    topic,
                    item,
                    plugin: this,
                },
            });
        }
    }
}
