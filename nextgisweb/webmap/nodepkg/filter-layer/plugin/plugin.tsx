import React, { Component, createRef, ReactElement, RefObject } from "react";
import { createRoot } from "react-dom/client";
import { Control } from "ol/control";
import { Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { topics } from "@nextgisweb/webmap/identify-module"
import FilterIcon from "@nextgisweb/icon/mdi/filter-outline";

import { FilterLayer } from "../FilterLayer";

import type { DojoDisplay, PluginParams } from "@nextgisweb/webmap/type";

import "./plugin.less";

export class FilterLayerPlugin extends Component {
    private _display: DojoDisplay;

    private point: HTMLDivElement;
    private root: React.ReactElement;
    private refFilter: RefObject<Element>;

    constructor(props: PluginParams) {
        super(props)
        this._display = props.display;

        this.point = document.createElement("div");
        this.root = createRoot(this.point);

        this.refFilter = createRef();
    }

    visible = (val) => {
        if (this.refFilter.current) {
            this.refFilter!.current.resizableElement.current.hidden = val;
            topics.publish("filter_hidden");
        }
    };

    run = (nodeData) => {
        this.root.render(<FilterLayer visible={this.visible} ref={this.refFilter} display={this._display} item={nodeData} loads={new Date} />);
        return Promise.resolve(nodeData);
    };

    startup() { }
    postCreate() { }
}

export class FilterControl extends Control {
    private element: HTMLDivElement;
    private root: ReactElement;

    constructor(props) {
        super(props);
        this.element = document.createElement("div");
        this.element.className = "ol-control ol-unselectable hide-button";

        this.root = createRoot(this.element);

        this.root.render(
            <Button onClick={() => { this.filter_show(); }} title={gettext("Filter show")}>
                <span className="ol-control__icon">
                    <FilterIcon />
                </span>
            </Button>
        );

        topics.subscribe("button_hidden", () => { this.filter_show() });

        topics.subscribe("filter_hidden", () => { this.element.className = "ol-control ol-unselectable show-button" });
    }

    filter_show = () => {
        topics.publish("filter_show");
        this.element.className = "ol-control ol-unselectable hide-button";
    };
}