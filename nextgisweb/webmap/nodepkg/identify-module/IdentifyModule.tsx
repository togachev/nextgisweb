import React, { Component, createRef, RefObject } from "react";
import { createRoot } from "react-dom/client";
import { pointClick } from "./icons/icon";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import { Map, MapBrowserEvent, Overlay } from "ol";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { Interaction } from "ol/interaction";
import { fromExtent } from "ol/geom/Polygon";
import { WKT } from "ol/format";
import { boundingExtent } from "ol/extent";
import { route } from "@nextgisweb/pyramid/api";
import { Point } from "ol/geom";
import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/";
import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
import "./IdentifyModule.less";

interface VisibleProps {
    hidden: boolean;
    overlay: boolean | undefined;
    key: string;
}

const settings = webmapSettings;

const srsCoordinates = {};
if (spatialRefSysList) {
    spatialRefSysList.forEach((srsInfo) => {
        srsCoordinates[srsInfo.id] = srsInfo;
    });
}

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
    private point_popup: HTMLDivElement;
    private point_context: HTMLDivElement;
    private root_popup: React.ReactElement;
    private root_context: React.ReactElement;
    private refPopup: RefObject<Element>;
    private refContext: RefObject<Element>;

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
        this.point_popup = document.createElement("div");
        this.point_popup.innerHTML = `<span class="icon-position">${pointClick}</span>`;
        this.root_popup = createRoot(this.popup);
        this.point_context = document.createElement("div");
        this.root_context = createRoot(this.point_context);

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

    _visible = ({ hidden, overlay, key }: VisibleProps) => {
        if (key === "popup") {
            if (this.refPopup.current) {
                this.refPopup.current.hidden = hidden
            }
            this.overlay_popup.setPosition(overlay);
        } else {
            if (this.refContext.current) {
                this.refContext.current.hidden = hidden
            }
            this.overlay_context.setPosition(overlay);
        }
    }

    _popupMultiple = (e: MapBrowserEvent) => {
        alert(e.pixel)
        // this._visible({ hidden: true, overlay: undefined, key: "context" })
        // this._setValue(this.point_popup, "popup");
        // this.root_popup.render(
        //     <PopupComponent tool={this} visible={this._visible} ref={this.refPopup} width={settings.popup_width} height={settings.popup_height} event={e} />
        // );
        // this._visible({ hidden: false, overlay: e.coordinate, key: "popup" });
    }

    positionContext = (event, _width, _height, offset, op, count) => {

        const W = document.documentElement.clientWidth;
        const H = document.documentElement.clientHeight;
        const px = event.originalEvent.clientX;
        const py = event.originalEvent.clientY;
        const context_height = settings.context_height;
        const context_width = settings.context_width;
        const popup_height = settings.popup_height;
        const popup_width = settings.popup_width;
        const coords_not_count_w = 250;
        const coords_not_count_h = 44;
        const offHP = 40;

        let width;
        let height;

        if (count === undefined && op === "context") {
            width = context_width;
            height = context_height;
        }
        else if (count === 0 && op !== "context") {
            width = coords_not_count_w;
            height = coords_not_count_h;
        }
        else if (popup_width>= W/2 || popup_height >= H/2) {
            width = W/2;
            height = H/2;
        }
        else {
            width = popup_width;
            height = popup_height;
        }

        if (H <= (context_height) * 2) {
            if (op === "context") {
                width = context_width;
                height = (H - offHP) <= context_height ? (H - offHP) * .8 : context_height;
                return { x: W - width, y: 0 + offHP, width: width, height: height }
            }
        }
        
        if (height >= H / 2 || width >= W / 2) {
            /*bottom left*/
            if (
                width / 2 + offHP >= px
                && (H - height / 2) < py
            ) {
                return { x: px + offset, y: py - height - offset, width: width, height: height }
            }

            /* bottom */
            if (
                (W - width / 2) > px
                && width / 2 + offHP <= px
                && (H - height / 2) <= py
            ) {
                return { x: px - width / 2, y: py - height - offset, width: width, height: height }
            }

            /* bottom right */
            if (
                (W - width / 2) <= px
                && (H - height / 2) <= py
            ) {
                return { x: px - width - offset, y: py - height - offset, width: width, height: height }
            }

            /* top left */
            if (
                height / 2 + offHP >= py
                && width / 2 + offHP >= px
            ) {
                return { x: px + offset, y: py + offset, width: width, height: height }
            }

            /* top */
            if (
                height / 2 + offHP >= py
                && (width / 2) < px
                && (W - width / 2) > px
            ) {
                return { x: px - width / 2, y: py + offset, width: width, height: height }
            }

            /* top right */
            if (
                height / 2 + offHP >= py
                && (W - width / 2) <= px
            ) {
                return { x: px - offset - width, y: py + offset, width: width, height: height }
            }

            /* left */
            if (
                height / 2 + offHP < py
                && (H - height / 2) > py
                && width / 2 + offHP > px
            ) {
                return { x: px + offset, y: py - height / 2, width: width, height: height }
            }

            /* right */
            if (
                height / 2 + offHP < py
                && (H - height / 2) > py
                && (W - width / 2) <= px
            ) {
                return { x: px - offset - width, y: py - height / 2, width: width, height: height }
            }

            /* center */
            if (
                height / 2 + offHP < py
                && (H - height / 2) > py
                && width / 2 + offHP < px
                && (W - width / 2) > px
            ) {
                return { x: px - width / 2, y: py - height / 2, width: width, height: height }
            }
        }
        if (height < H / 2 || width < W / 2) {
            /*top left*/
            if (
                H - height - offset >= py
                && W - width - offset >= px
            ) {
                return { x: px + offset, y: py + offset, width: width, height: height }
            }

            /*top right*/
            if (
                H - height - offset >= py
                && W - width - offset < px
            ) {
                return { x: px - width - offset, y: py + offset, width: width, height: height }
            }

            /*bottom left*/
            if (
                H - height - offset < py
                && W - width >= px
            ) {
                return { x: px + offset, y: py - height - offset, width: width, height: height }
            }

            /*bottom right*/
            if (
                W - width - offset < px
                && H - height - offset < py
            ) {
                return { x: px - width - offset, y: py - height - offset, width: width, height: height }
            }
        }
    }

    displayFeatureInfo = async (event: MapBrowserEvent, value: number, op: string) => {
        const wkt = new WKT();
        const point = event.coordinate;
        const coords = await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: value,
                    srs_to: Object.keys(srsCoordinates).map(Number),
                    geom: wkt.writeGeometry(new Point(point)),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== value)
                const wktPoint = wkt.readGeometry(t.geom);
                const transformedCoord = wktPoint.getCoordinates();
                return transformedCoord;
            });

        const pixel = event.pixel;
        const request: RequestProps = {
            srs: 3857,
            geom: this._requestGeomString(pixel),
            styles: [],
        };

        this.display.getVisibleItems()
            .then(items => {
                const itemConfig = this.display.getItemConfig();
                const mapResolution = this.olmap.getView().getResolution();
                items.map(i => {
                    const item = itemConfig[i.id];
                    if (
                        !item.identifiable ||
                        mapResolution >= item.maxResolution ||
                        mapResolution < item.minResolution
                    ) {
                        return;
                    }
                    request.styles.push({ id: item.styleId, label: item.label });
                });
            })
        const response = op === "popup" && await route("feature_layer.identify_module")
            .post({
                json: request,
            })
            .then((response) => {
                return response;
            })

        const width = settings.popup_width;
        const height = settings.popup_height;

        const offset = op === "popup" ? settings.offset_point : 0;
        const position = this.positionContext(event, width, height, offset, op, response.featureCount);

        const coordValue = coords && coords[1].toFixed(6) + ", " + coords[0].toFixed(6);

        if (op === "context") {
            return { coordValue, position };
        } else {
            return { coordValue, position, response };
        }
    };

    _popup = (e: MapBrowserEvent) => {
        this.displayFeatureInfo(e, 3857, "popup").then(item => {
            this._visible({ hidden: true, overlay: undefined, key: "context" })
            this._setValue(this.point_popup, "popup");

            this.root_popup.render(
                <PopupComponent  key={new Date} params={item} visible={this._visible} ref={this.refPopup} />
            );
            this._visible({ hidden: false, overlay: e.coordinate, key: "popup" });
        });

    }

    _context = (e: MapBrowserEvent) => {
        this.displayFeatureInfo(e, 3857, "context").then(item => {
            this._setValue(this.point_context, "context")
            this.root_context.render(
                <ContextComponent params={item} ref={this.refContext} />
            );
            this._visible({ hidden: false, overlay: e.coordinate, key: "context" });
        })
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
