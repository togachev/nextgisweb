import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import topic from "@nextgisweb/webmap/compat/topic";
import type { TreeLayerStore } from "@nextgisweb/webmap/store/tree-store/TreeItemStore";

import { PluginBase } from "../PluginBase";

import TableIcon from "@nextgisweb/icon/material/table";
import OpenInNew from "@nextgisweb/icon/material/open_in_new";

import type { LayerItemConfig } from "@nextgisweb/webmap/type/api";

export class FeatureLayerPlugin extends PluginBase {
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
            const layerId = item.layerId;
            
            this.display.tabsManager.addTab({
                key: String(layerId),
                label: item.label,
                component: () =>
                    import("@nextgisweb/webmap/webmap-feature-grid-tab"),
                props: {
                    topic,
                    layerId: layerId,
                    plugin: this,
                },
            });
        }
    }
}
