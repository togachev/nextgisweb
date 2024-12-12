import type { DojoDisplay, PluginParams } from "@nextgisweb/webmap/type";
import { gettext } from "@nextgisweb/pyramid/i18n";
class FilterLayerPlugin {
    private _display: DojoDisplay;

    private getPluginState(nodeData) {
        const { type, layerCls } = nodeData;
        const typeLayer = ["postgis_layer", "vector_layer"]
        return {
            enabled:
                !this._display.tinyConfig && type === "layer" && typeLayer.includes(layerCls),
        };
    }

    private getMenuItem(nodeData) {
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

    constructor(params: PluginParams) {
        this._display = params.display;
    }

    startup() { }
    postCreate() { }
}

export default FilterLayerPlugin;
