import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import type { PluginState } from "@nextgisweb/webmap/type";
import type { LayerItemConfig } from "@nextgisweb/webmap/type/api";

import { PluginBase } from "../PluginBase";

import LayersEdit from "@nextgisweb/icon/mdi/layers-edit";
import EyeOoutline from "@nextgisweb/icon/mdi/eye-outline";

export class LayerSettingsPlugin extends PluginBase {
    getPluginState(nodeData: LayerItemConfig): PluginState {
        const state = super.getPluginState(nodeData);
        const typeLayer = ["postgis_layer", "vector_layer"];
        return {
            ...state,
            enabled: !!(state.enabled && !this.display.tinyConfig && typeLayer.includes(nodeData.layerCls)),
        };
    }

    getMenuItem(nodeData: LayerItemConfig) {
        return {
            icon: <LayersEdit />,
            title: gettext("Layer settings"),
            onClick: () => {
                window.open(routeURL("resource.update", { id: nodeData.layerId }), "_blank");
            },
            extra:
                <span
                    className="show-resource"
                    title={gettext("Layer show")}
                    onClick={() => {
                        window.open(routeURL("resource.show", { id: nodeData.layerId }), "_blank");
                    }}
                >
                    <EyeOoutline />
                </span >,
        };
    }
}
