import type { DojoDisplay, PluginParams } from "@nextgisweb/webmap/type";
import { gettext } from "@nextgisweb/pyramid/i18n";
class FilterLayerPlugin {
    private _display: DojoDisplay;

    constructor(params: PluginParams) {
        this._display = params.display;
    }

    private getPluginState = (nodeData) => {
        const { type } = nodeData;
        const typeLayer = ["postgis_layer", "vector_layer"]
        return {
            enabled:
                !this._display.tinyConfig && nodeData.type === "layer" && typeLayer.includes(nodeData.layerCls),
        };
    }

    private getMenuItem = (nodeData) => {
        return {
            icon: "material-filter_alt",
            title: gettext("Filter layer"),
            onClick: () => {
                console.log(nodeData);
                console.log(this._display);
                return Promise.resolve(undefined);
            },
        };
    }

    startup() {}
    postCreate() {}
}

export default FilterLayerPlugin;
