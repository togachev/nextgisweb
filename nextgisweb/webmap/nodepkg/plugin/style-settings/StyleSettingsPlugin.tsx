import { gettext } from "@nextgisweb/pyramid/i18n";
import { routeURL } from "@nextgisweb/pyramid/api";
import type { PluginState } from "@nextgisweb/webmap/type";
import type { LayerItemConfig } from "@nextgisweb/webmap/type/api";

import { PluginBase } from "../PluginBase";

import ImageEdit from "@nextgisweb/icon/mdi/image-edit";
import OpenInNew from "@nextgisweb/icon/material/open_in_new";

export class StyleSettingsPlugin extends PluginBase {
    getPluginState(nodeData: LayerItemConfig): PluginState {
        const state = super.getPluginState(nodeData);
        const typeLayer = ["postgis_layer", "vector_layer", "raster_layer"];
        
        return {
            ...state,
            enabled: !!(state.enabled && !this.display.tinyConfig && typeLayer.includes(nodeData.layerCls)),
        };
    }

    getMenuItem(nodeData: LayerItemConfig) {
        return {
            icon: <ImageEdit />,
            title: gettext("Style settings"),
            onClick: () => {
                window.open(routeURL("resource.update", { id: nodeData.styleId }), "_blank");
            },
            extra:
                <span
                className="show-resource"
                title={gettext("Style show")}
                    onClick={() => {
                        window.open(routeURL("resource.show", { id: nodeData.styleId }), "_blank");
                    }}
                >
                    <OpenInNew />
                </span >,
        };
    }
}
