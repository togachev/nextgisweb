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

import { positionContext } from "./positionContext"

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
    if (e.type === "singleclick" && e.originalEvent.ctrlKey === false) {
        this.tool._popup(e);
        e.preventDefault();
    } else if (e.type === "singleclick" && e.originalEvent.ctrlKey === true) {
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
    private mapEvent: MapBrowserEvent;
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
    };

    activate = () => {
        this.control.setActive(true);
    };

    deactivate = () => {
        this.control.setActive(false);
    };

    _setValue = (value: HTMLElement, key: string) => {
        key === "popup" ?
            this.overlay_popup.setElement(value) :
            this.overlay_context.setElement(value)
    };

    _addOverlayPopup = () => {
        this.overlay_popup = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_popup);
    };

    _addOverlayContext = () => {
        this.overlay_context = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_context);
    };

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
    };

    _render = () => {
        this.display.identify_module.root_popup.render();
    };

    _popupMultiple = (e: MapBrowserEvent) => {
        alert(e.pixel);
    };

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
            });

        const offset = op === "popup" ? settings.offset_point : 0;
        const position = positionContext(event, offset, op, response.featureCount, settings);
        const coordValue = coords && coords[1].toFixed(6) + ", " + coords[0].toFixed(6);

        if (op === "context") {
            return { coordValue, position };
        } else {
            return { coordValue, position, response };
        }
    };

    _isEditEnabled = (display, config) => {
        const pluginName = "ngw-webmap/plugin/FeatureLayer";

        if (display.isTinyMode() && !display.isTinyModePlugin(pluginName)) {
            return false;
        }

        const configLayerPlugin = config.plugin[pluginName];
        const readOnly = configLayerPlugin.readonly;
        return !readOnly;
    };

    _popup = (e: MapBrowserEvent) => {
        this.mapEvent = e;
        this.displayFeatureInfo(e, 3857, "popup").then(item => {
            this._visible({ hidden: true, overlay: undefined, key: "context" })
            this._setValue(this.point_popup, "popup");
            this.root_popup.render(
                <PopupComponent key={new Date} params={item} display={this.display} visible={this._visible} ref={this.refPopup} />
            );
            this._visible({ hidden: false, overlay: e.coordinate, key: "popup" });
        });
    };

    _context = (e: MapBrowserEvent) => {
        this.displayFeatureInfo(e, 3857, "context").then(item => {
            this._setValue(this.point_context, "context")
            this.root_context.render(
                <ContextComponent params={item} visible={this._visible} ref={this.refContext} />
            );
            this._visible({ hidden: false, overlay: e.coordinate, key: "context" });
        })
    };

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
    };
}
