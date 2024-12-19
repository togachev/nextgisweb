/// <reference types="dojo/dijit" />

import { orderBy } from "lodash-es";
import Attribution from "ol/control/Attribution";
import Rotate from "ol/control/Rotate";
import ScaleLine from "ol/control/ScaleLine";
import Zoom from "ol/control/Zoom";

import { gettext } from "@nextgisweb/pyramid/i18n";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import URL parser module
import { html } from "@nextgisweb/pyramid/icon";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import URL parser module
import InfoScale from "ngw-webmap/controls/InfoScale";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import URL parser module
import InitialExtent from "ngw-webmap/controls/InitialExtent";
import { FilterControl } from "@nextgisweb/webmap/filter-layer/FilterControl";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import URL parser module
import MyLocation from "ngw-webmap/controls/MyLocation";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Import URL parser module
import Identify from "ngw-webmap/tool/Identify";
import { IdentifyModule } from "@nextgisweb/webmap/identify-module";
import type { DojoDisplay, MapControl } from "../type";

import { ToolsInfo, buildTools, getToolsInfo } from "./map-tools";
import type { ControlInfo, ControlReady } from "./type";
import { getControlsInfo } from "./utils";

import webmapSettings from "@nextgisweb/pyramid/settings!webmap";

export const getLabel = (glyph: string): HTMLElement => {
    const labelEl = document.createElement("span");
    labelEl.innerHTML = html({ glyph });
    labelEl.classList.add("ol-control__icon");
    return labelEl;
};

export const ControlsInfo: ControlInfo[] = [
    {
        key: "z",
        ctor: (display) => {
            return new Zoom({
                zoomInLabel: getLabel("add"),
                zoomOutLabel: getLabel("remove"),
                zoomInTipLabel: gettext("Zoom in"),
                zoomOutTipLabel: gettext("Zoom out"),
                target: display.leftTopControlPane,
            });
        },
        embeddedShowMode: "always",
        olMapControl: true,
    },
    {
        key: "attr",
        ctor: (display) => {
            return new Attribution({
                tipLabel: gettext("Attributions"),
                target: display.rightBottomControlPane,
                collapsible: false,
            });
        },
        embeddedShowMode: "always",
        olMapControl: true,
    },
    {
        key: "rot",
        ctor: (display) => {
            return new Rotate({
                tipLabel: gettext("Reset rotation"),
                target: display.leftTopControlPane,
                label: getLabel("arrow_upward"),
            });
        },
        olMapControl: true,
    },
    {
        key: "sl",
        ctor: (display) => {
            return new ScaleLine({
                target: display.rightBottomControlPane,
                minWidth: 48,
            });
        },
        label: gettext("Scale line"),
        embeddedShowMode: "customize",
        olMapControl: true,
    },
    {
        key: "is",
        ctor: (display) => {
            return new InfoScale({
                display: display,
                target: display.rightBottomControlPane,
            });
        },
        label: gettext("Info scale"),
        embeddedShowMode: "customize",
        olMapControl: true,
    },
    {
        key: "ie",
        ctor: (display) => {
            return new InitialExtent({
                display: display,
                target: display.leftTopControlPane,
                tipLabel: gettext("Initial extent"),
            });
        },
        label: gettext("Initial extent"),
        embeddedShowMode: "customize",
        olMapControl: true,
    },
    {
        key: "fl",
        ctor: (display) => {
            return new FilterControl({
                display: display,
                target: display.leftTopControlPane,
                tipLabel: gettext("Filter show"),
            });
        },
        label: gettext("Filter show"),
        embeddedShowMode: "customize",
        olMapControl: true,
    },
    {
        key: "ml",
        ctor: (display) => {
            return new MyLocation({
                display: display,
                target: display.leftTopControlPane,
                tipLabel: gettext("Locate me"),
            });
        },
        label: gettext("Locate me"),
        embeddedShowMode: "customize",
        olMapControl: true,
    },
];

if (!webmapSettings.identify_module) {
    ControlsInfo.push({
        label: gettext("Identification"),
        ctor: (display) => {
            return new Identify({ display });
        },
        key: "id",
        mapStateKey: "identifying",
        embeddedShowMode: "customize",
        olMapControl: false,
    })
} else {
    ControlsInfo.push({
        key: "im",
        label: gettext("Identification module"),
        ctor: (display) => {
            return new IdentifyModule(display);
        },
        mapStateKey: "identify_module",
        embeddedShowMode: "customize",
        olMapControl: false,
    })
}

export const buildControls = (
    display: DojoDisplay
): Map<string, ControlReady> => {
    const controlsMap = new Map<string, ControlReady>();

    const controlsInfo = getControlsInfo<ControlInfo>(display, ControlsInfo);
    const controlsToMap: MapControl[] = [];
    controlsInfo.forEach((c: ControlInfo) => {
        const control = c.ctor(display);
        if (c.postCreate) {
            c.postCreate(display, control);
        }
        controlsMap.set(c.key, { info: c, control });
        if (c.olMapControl) {
            controlsToMap.push(control);
        }
    });
    display._mapAddControls(controlsToMap);

    const toolsInfo = getToolsInfo(display);
    const mapToolbar = buildTools(display, toolsInfo, controlsMap);
    display._mapAddControls([mapToolbar]);

    return controlsMap;
};

export const getControls = () => {
    const controls = [...ControlsInfo, ...ToolsInfo];
    return orderBy(controls, ["label"]);
};
