import { action, observable } from "mobx";
import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { createPortal } from "react-dom";
import { Map as olMap, Overlay } from "ol";
import { PointClick } from "@nextgisweb/webmap/icon";
import webmapSettings from "@nextgisweb/webmap/client-settings";

import type { Root as ReactRoot } from "react-dom/client";
import type { Display } from "@nextgisweb/webmap/display";

interface SourceProps {
    typeEvents: string;
    pixel: number[];
    clientPixel: number[];
    coordinate: number[];
    lonlat: number[];
}

const popup_height = webmapSettings.popup_size.height;
const popup_width = webmapSettings.popup_size.width;
const context_item = 0
const context_height = 24 + context_item * length;
const context_width = 200;

export class Store {
    display: Display;
    overlayPoint: Overlay;
    olmap: olMap;
    pointElement = document.createElement("div");
    popupElement = document.createElement("div");
    contextElement = document.createElement("div");

    refPopup = createRef<HTMLDivElement>();
    refContext = createRef<HTMLDivElement>();

    private rootPointClick: ReactRoot | null = null;
    private rootPopup: ReactRoot | null = null;
    private rootContext: ReactRoot | null = null;

    @observable.ref accessor pointPopupClick: SourceProps;
    @observable.ref accessor pointContextClick: SourceProps;

    constructor({
        display,
    }) {
        this.display = display;
        this.olmap = this.display.map.olMap;
        this._addOverlay();
        this.pointElement.className = "point-click";
        this.rootPointClick = createRoot(this.pointElement);
        this.popupElement.className = "popup-position";
        this.rootPopup = createRoot(this.popupElement);
        this.contextElement.className = "context-position";
        this.rootContext = createRoot(this.contextElement);
    }

    _addOverlay = () => {
        this.overlayPoint = new Overlay({});
        this.olmap.addOverlay(this.overlayPoint);
    };

    renderPopup = (coordinate, content) => {
        this.overlayPoint.setElement(this.pointElement);
        this.overlayPoint.setPosition(coordinate);
        this.rootPointClick.render(<PointClick />);

        this.rootPopup.render(
            createPortal(
                <div
                    ref={this.refPopup}
                    style={{
                        position: "absolute",
                        top: this.pointPopupClick.clientPixel[1] + 10,
                        left: this.pointPopupClick.clientPixel[0] + 10,
                        backgroundColor: "white",
                        width: popup_width,
                        height: popup_height,
                    }}
                >
                    {content}
                </div>,
                document.getElementById("portal-popup")
            )
        );
    };

    renderContext = (content) => {
        this.rootContext.render(
            createPortal(
                <div
                    ref={this.refContext}
                    style={{
                        position: "absolute",
                        top: this.pointContextClick.clientPixel[1] + 10,
                        left: this.pointContextClick.clientPixel[0] + 10,
                        backgroundColor: "white",
                        width: context_width,
                        height: context_height,
                    }}
                >
                    {content}
                </div>,
                document.getElementById("portal-context")
            )
        );
    };

    @action
    setPointPopupClick(pointPopupClick: SourceProps) {
        this.pointPopupClick = pointPopupClick;
    };

    @action
    setPointContextClick(pointContextClick: SourceProps) {
        this.pointContextClick = pointContextClick;
    };
}