import React, { Component } from "react";
import { createRoot } from "react-dom/client";

import FilterLayer from "../FilterLayer";

import type { DojoDisplay, PluginParams } from "@nextgisweb/webmap/type";
import { gettext } from "@nextgisweb/pyramid/i18n";

class FilterLayerPlugin extends Component {
    private _display: DojoDisplay;

    private point: HTMLDivElement;
    private root: React.ReactElement;

    constructor(props: PluginParams) {
        super(props)
        this._display = props.display;

        this.point = document.createElement("div");
        this.root = createRoot(this.point);
    }

    displayFilter = (nodeData) => {
        this.root.render(<FilterLayer display={this._display} item={nodeData} loads={new Date} />);
    };

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
                this.displayFilter(nodeData);
                return Promise.resolve(undefined);
            },
        };
    }

    startup() { }
    postCreate() { }
}

export default FilterLayerPlugin;
