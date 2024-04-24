import { React, Component, createRef, RefObject } from 'react';
import { createRoot } from 'react-dom/client';
import { pointClick } from "./icons/icon";
import type { DojoDisplay } from "../type";
import type OlMap from "ol/Map";
import Overlay from "ol/Overlay.js";
import type OlOverlay from 'ol/Overlay.js';
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { Interaction } from "ol/interaction";
import type { Control as OlControl } from "ol/control";

import { PopupComponent } from "./component/PopupComponent";
import { ContextComponent } from "./component/ContextComponent";

import "./IdentifyModule.less";

const settings = webmapSettings;

const Control = function (options) {
    this.tool = options.tool;
    Interaction.call(this, {
        handleEvent: Control.prototype.handleClickEvent,
    });
};

Control.prototype = Object.create(Interaction.prototype);
Control.prototype.constructor = Control;

Control.prototype.handleClickEvent = function (e) {
    if (e.type === "singleclick" && e.originalEvent.ctrlKey === false) {
        this.tool._popup(e);
        e.preventDefault();
    } else if (e.type === "contextmenu" && e.originalEvent.ctrlKey === false) {
        this.tool._context(e);
        e.preventDefault();
    }
    return true;
};

export class IdentifyModule extends Component {
    private display: DojoDisplay
    private olmap: OlMap;
    private overlay_popup: OlOverlay;
    private overlay_context: OlOverlay;
    private control: OlControl;
    private popup: HTMLDivElement;
    private point: HTMLDivElement;
    private context: HTMLDivElement;
    private root_popup: React.ReactElement;
    private root_context: React.ReactElement;
    private refPopup: RefObject<HTMLInputElement>;
    private refContext: RefObject<HTMLInputElement>;

    constructor(props: DojoDisplay) {
        super(props)

        this.display = props;
        this.olmap = this.display.map.olMap;
        this.control = new Control({ tool: this });
        this.control.setActive(false);
        this.olmap.addInteraction(this.control);

        this._addOverlayPopup();
        this._addOverlayContext();

        this.popup = document.createElement("div");
        this.point = document.createElement("div");
        this.point.innerHTML = `<span class="icon-position">${pointClick}</span>`;
        this.root_popup = createRoot(this.popup);
        this.context = document.createElement("div");
        this.root_context = createRoot(this.context);

        this.refPopup = createRef();
        this.refContext = createRef();
    }

    activate = () => {
        this.control.setActive(true);
    }

    deactivate = () => {
        this.control.setActive(false);
    }

    _setValuePopup = (value: HTMLElement) => {
        this.overlay_popup.setElement(value);
    }

    _setValueContext = (value: HTMLElement) => {
        this.overlay_context.setElement(value);
    }

    _addOverlayPopup = () => {
        this.overlay_popup = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_popup);
    }

    _addOverlayContext = () => {
        this.overlay_context = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_context);
    }

    _visiblePopup = (portal, overlay) => {
        if (this.refPopup.current) {
            this.refPopup.current.hidden = portal
        }
        this.overlay_popup.setPosition(overlay);
    }

    _visibleContext = (portal, overlay) => {
        if (this.refContext.current) {
            this.refContext.current.hidden = portal
        }
        this.overlay_context.setPosition(overlay);
    }

    _popup = (e) => {
        this._visibleContext(true, undefined)
        this._setValuePopup(this.point);
        this.root_popup.render(<PopupComponent visible={this._visiblePopup} ref={this.refPopup} width={settings.popup_width} height={settings.popup_height} event={e} />);
        this._visiblePopup(false, e.coordinate);
    }

    _context = (e) => {
        
        this._setValueContext(this.context)
        this.root_context.render(<ContextComponent opened={true} ref={this.refContext} width={settings.context_width} height={settings.context_height} event={e} />);
        this._visibleContext(false, e.coordinate)
    }
}
