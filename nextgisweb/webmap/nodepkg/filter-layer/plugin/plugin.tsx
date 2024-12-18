import React, { Component } from "react";
import { createRoot } from "react-dom/client";

import FilterLayer from "../FilterLayer";

import type { DojoDisplay, PluginParams } from "@nextgisweb/webmap/type";

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

    private run(nodeData) {
        this.root.render(<FilterLayer display={this._display} item={nodeData} loads={new Date} />);
        return Promise.resolve(nodeData);
    };

    startup() { }
    postCreate() { }
}

export default FilterLayerPlugin;
