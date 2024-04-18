import type { DojoDisplay } from "../type";
import type OlMap from "ol/Map";
import Overlay from "ol/Overlay.js";
import type OlOverlay from 'ol/Overlay.js';
import { gettext } from "@nextgisweb/pyramid/i18n";
import { mdi } from "@nextgisweb/pyramid/icon";
import "./IdentifyModule.less";

interface IState {
    count: number;
}

export class IdentifyModule {
    private _display: DojoDisplay;
    private state: IState;
    private _olmap: OlMap;
    private _overlay: OlOverlay;

    constructor(display: DojoDisplay) {

        this._display = display;
        this._olmap = display.map.olMap;
        this._overlay = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.pointPosition();
    }

    setContext = (value) => {
        this._overlay.setElement(value);
        console.log(this._overlay);
    }

    pointPosition = () => {
        const point = document.createElement("div");
        point.className = "ol-control ol-unselectable";
        const icon = mdi({ glyph: "record-circle-outline" });
        point.innerHTML = `<span class="icon-position">${icon}</span>`;
        point.title = gettext("Position click map");

        const context = document.createElement("div");
        context.className = "ol-control ol-unselectable";
        context.innerHTML = `<div class="context-position">test</div>`
        context.title = gettext("Position click map");


        this._olmap.on(["contextmenu", "singleclick"], (e) => {
            if (e.dragging) return;

            if (e.type === "contextmenu" && e.originalEvent.shiftKey === true && e.originalEvent.ctrlKey === false) {
                this.setContext(context)
                this._olmap.addOverlay(this._overlay);
                this._overlay.setPosition(e.coordinate);
                console.log(e.pixel, "contextmenu");
            }
            if (e.type === "singleclick" && e.originalEvent.shiftKey === true && e.originalEvent.ctrlKey === false) {
                this.setContext(point)
                this._olmap.addOverlay(this._overlay);
                this._overlay.setPosition(e.coordinate);
                console.log(e.pixel, "singleclick");
            }
            e.preventDefault();
        });
    }
}

