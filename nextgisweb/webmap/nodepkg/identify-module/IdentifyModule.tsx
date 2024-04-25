import { React, Component, createRef, RefObject } from "react";
import { createRoot } from "react-dom/client";
import { pointClick } from "./icons/icon";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import { Map, MapBrowserEvent, Overlay } from "ol";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { Interaction } from "ol/interaction";
import { fromExtent } from "ol/geom/Polygon";
import { WKT } from "ol/format";
import { boundingExtent } from "ol/extent";

import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";

import "./IdentifyModule.less";

interface VisibleProps {
    portal: boolean;
    overlay: boolean | undefined;
    key: string;
}

const settings = webmapSettings;

const Control = function (options) {
    this.tool = options.tool;
    Interaction.call(this, {
        handleEvent: Control.prototype.handleClickEvent,
    });
};

Control.prototype = Object.create(Interaction.prototype);
Control.prototype.constructor = Control;

Control.prototype.handleClickEvent = function (e: MapBrowserEvent) {
    if (e.type === "singleclick" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
        this.tool._popup(e);
        e.preventDefault();
    } else if (e.type === "singleclick" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === true) {
        this.tool._popupMultiple(e);
        e.preventDefault();
    } else if (e.type === "contextmenu" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
        this.tool._context(e);
        e.preventDefault();
    }
    return true;
};

export class IdentifyModule extends Component {
    private display: DojoDisplay
    private olmap: Map;
    private overlay_popup: Overlay;
    private overlay_context: Overlay;
    private control: Interaction;
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

    _setValue = (value: HTMLElement, key: string) => {
        key === "popup" ?
            this.overlay_popup.setElement(value) :
            this.overlay_context.setElement(value)
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

    _visible = ({ portal, overlay, key }: VisibleProps) => {
        if (key === "popup") {
            if (this.refPopup.current) {
                this.refPopup.current.hidden = portal
            }
            this.overlay_popup.setPosition(overlay);
        } else {
            if (this.refContext.current) {
                this.refContext.current.hidden = portal
            }
            this.overlay_context.setPosition(overlay);
        }
    }

    _popupMultiple = (e: MapBrowserEvent) => {
        alert(e.pixel)
        // this._visible({ portal: true, overlay: undefined, key: "context" })
        // this._setValue(this.point, "popup");
        // this.root_popup.render(
        //     <PopupComponent tool={this} visible={this._visible} ref={this.refPopup} width={settings.popup_width} height={settings.popup_height} event={e} />
        // );
        // this._visible({ portal: false, overlay: e.coordinate, key: "popup" });
    }

    _popup = (e: MapBrowserEvent) => {
        this._visible({ portal: true, overlay: undefined, key: "context" })
        this._setValue(this.point, "popup");
        this.root_popup.render(
            <PopupComponent tool={this} visible={this._visible} ref={this.refPopup} width={settings.popup_width} height={settings.popup_height} event={e} />
        );
        this._visible({ portal: false, overlay: e.coordinate, key: "popup" });
    }

    _context = (e: MapBrowserEvent) => {
        this._setValue(this.context, "context")
        this.root_context.render(
            <ContextComponent tool={this} ref={this.refContext} width={settings.context_width} height={settings.context_height} event={e} />
        );
        this._visible({ portal: false, overlay: e.coordinate, key: "context" });
    }

    _requestGeomString = (pixel: number[]) => {
        const pixelRadius = settings.identify_radius;

        return new WKT().writeGeometry(
            fromExtent(
                boundingExtent([
                    this.olmap.getCoordinateFromPixel([
                        pixel[0] - pixelRadius,
                        pixel[1] - pixelRadius,
                    ]),
                    this.olmap.getCoordinateFromPixel([
                        pixel[0] + pixelRadius,
                        pixel[1] + pixelRadius,
                    ]),
                ])
            )
        )
    }
}
