import React from "react";
import { Control } from "ol/control";
import { createRoot } from "react-dom/client";
import { Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { topics } from "@nextgisweb/webmap/identify-module"
import FilterIcon from "@nextgisweb/icon/material/filter_alt";

import "./FilterControl.less";

export class FilterControl extends Control {
    private element: HTMLDivElement;
    private root: React.ReactElement;

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

        topics.subscribe("button_hidden",
            (e) => {
                this.filter_show();
            }
        );

        topics.subscribe("filter_hidden",
            (e) => {
                this.element.className = "ol-control ol-unselectable show-button";
            }
        );
    }

    filter_show = () => {
        topics.publish("filter_show");
        this.element.className = "ol-control ol-unselectable hide-button";
    };
}
