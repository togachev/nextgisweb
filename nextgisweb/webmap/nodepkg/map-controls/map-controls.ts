import { orderBy } from "lodash-es";
import { Control } from "ol/control";
import Attribution from "ol/control/Attribution";
import Rotate from "ol/control/Rotate";
import ScaleLine from "ol/control/ScaleLine";
import Zoom from "ol/control/Zoom";
import type { FC } from "react";
import { isMobile as isM } from "react-device-detect";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { iconHtml } from "@nextgisweb/pyramid/icon";

import type { Display } from "../display";
import { InfoScale } from "./control/InfoScale";
import { InitialExtent } from "./control/InitialExtent";
import { MyLocation } from "./control/MyLocation";
import { ToolsInfo, buildTools, getToolsInfo } from "./map-tools";
import { Identify } from "./tool/Identify";
import type { ControlInfo, ControlReady } from "./type";
import { getControlsInfo } from "./utils";

import ZoomInIcon from "@nextgisweb/icon/material/add";
import NorthIcon from "@nextgisweb/icon/material/arrow_upward";
import ZoomOutIcon from "@nextgisweb/icon/material/remove";

import settings from "@nextgisweb/webmap/client-settings";

export const getLabel = (Icon: FC & { id: string }): HTMLElement => {
    const labelEl = document.createElement("span");
    labelEl.innerHTML = iconHtml(Icon);
    labelEl.classList.add("ol-control__icon");
    return labelEl;
};

export const ControlsInfo: ControlInfo[] = [
    {
        key: "z",
        ctor: (display) => {
            return new Zoom({
                zoomInLabel: getLabel(ZoomInIcon),
                zoomOutLabel: getLabel(ZoomOutIcon),
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
                label: getLabel(NorthIcon),
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

if (!settings.imodule || isM) {
    ControlsInfo.push(    {
        label: gettext("Identification"),
        ctor: (display) => {
            return new Identify({ display });
        },
        key: "id",
        mapStateKey: "identifying",
        embeddedShowMode: "customize",
        olMapControl: false,
    })
}

export const buildControls = (display: Display): Map<string, ControlReady> => {
    const controlsMap = new Map<string, ControlReady>();

    const controlsInfo = getControlsInfo<ControlInfo>(display, ControlsInfo);
    const controlsToMap: Control[] = [];
    controlsInfo.forEach((c: ControlInfo) => {
        const control = c.ctor(display);
        if (c.postCreate) {
            c.postCreate(display, control);
        }
        controlsMap.set(c.key, { info: c, control });

        if (control instanceof Control) {
            controlsToMap.push(control);
        }
    });
    display._mapAddControls(controlsToMap);

    const toolsInfo = getToolsInfo(display);
    const mapToolbar = buildTools(display, toolsInfo, controlsMap);
    if (mapToolbar) {
        display._mapAddControls([mapToolbar]);
    }

    return controlsMap;
};

export const getControls = () => {
    const controls = [...ControlsInfo, ...ToolsInfo];
    return orderBy(controls, ["label"]);
};
