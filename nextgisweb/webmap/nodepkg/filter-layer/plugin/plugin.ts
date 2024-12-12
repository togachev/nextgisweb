import type { DojoDisplay, PluginParams } from "@nextgisweb/webmap/type";
import { gettext } from "@nextgisweb/pyramid/i18n";
class FilterLayerPlugin {
    private _display: DojoDisplay;

    constructor(params: PluginParams) {
        this._display = params.display;
    }

    getPluginState = (nodeData) => {
        const { type, plugin } = nodeData;
        return {
            enabled: type === "layer",
        };
    }

    getMenuItem = (nodeData) => {
        return {
            icon: "material-filter_alt",
            title: gettext("Filter layer"),
            onClick: () => {
                console.log(nodeData);
                console.log(this._display);
                // return Promise.resolve(undefined);
            },
        };
    }

    startup() {}
    postCreate() {}
}

export default FilterLayerPlugin;
