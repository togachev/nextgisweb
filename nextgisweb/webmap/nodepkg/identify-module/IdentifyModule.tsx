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
import { route } from "@nextgisweb/pyramid/api";
import { Point } from "ol/geom";
import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/";
import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
import "./IdentifyModule.less";

interface VisibleProps {
    portal: boolean;
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
    // if (e.dragging) return;
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
        // this._setValue(this.point_popup, "popup");
        // this.root_popup.render(
        //     <PopupComponent tool={this} visible={this._visible} ref={this.refPopup} width={settings.popup_width} height={settings.popup_height} event={e} />
        // );
        // this._visible({ portal: false, overlay: e.coordinate, key: "popup" });
    }

    positionContext = (event, width, height, offset) => {
        /*top left*/
        if (
            event.originalEvent.layerX + width <= event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY + height <= event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX + offset, y: event.originalEvent.clientY + offset }
        }

        /*top right*/
        if (
            event.originalEvent.layerX + width > event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY + height < event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX - width, y: event.originalEvent.clientY + offset }
        }

        /*bottom left*/
        if (
            event.originalEvent.layerX < event.originalEvent.srcElement.clientWidth - width
            && event.originalEvent.layerY < event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX + offset, y: event.originalEvent.clientY - height }
        }

        /*bottom right*/
        if (
            event.originalEvent.layerX < event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY < event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX - width, y: event.originalEvent.clientY - height }
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
        const response = await route("feature_layer.identify_module")
            .post({
                json: request,
            })
            .then((response) => {
                return response
            })
        
        const width = op === "popup" ? settings.popup_width : settings.context_width;
        const height = response.featureCount > 0 && op === "popup" ? settings.popup_height : op === "context" ? settings.context_height : 50;
        const offset = op === "popup" ? settings.offset_point : 0;
        const pos = this.positionContext(event, width + offset, height + offset, offset);

        if (op === "context") {
            return { coords, pos, width, height };
        } else {
            return { response, coords, pos, width, height };
        }
    };

    _popup = (e: MapBrowserEvent) => {
        this.displayFeatureInfo(e, 3857, "popup").then(item => {
            this._visible({ portal: true, overlay: undefined, key: "context" })
            this._setValue(this.point_popup, "popup");
            this.root_popup.render(
                <PopupComponent pos={item.pos} coords={item.coords} response={item.response} visible={this._visible} ref={this.refPopup} width={item.width} height={item.height} />
            );
            this._visible({ portal: false, overlay: e.coordinate, key: "popup" });
        });

    }

    _context = (e: MapBrowserEvent) => {
        this.displayFeatureInfo(e, 3857, "context").then(item => {
            this._setValue(this.point_context, "context")
            this.root_context.render(
                <ContextComponent pos={item.pos} coords={item.coords} ref={this.refContext} width={item.width} height={item.height} />
            );
            this._visible({ portal: false, overlay: e.coordinate, key: "context" });
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
