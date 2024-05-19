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
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { Point } from "ol/geom";
import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/";
import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
import "./IdentifyModule.less";
import { positionContext } from "./positionContext"
import URL from "ngw-webmap/utils/URL";
import CoordinateSwitcher from "ngw-webmap/ui/CoordinateSwitcher/CoordinateSwitcher";

interface VisibleProps {
    hidden: boolean;
    overlay: number[] | undefined;
    key: string;
}

interface EventProps {
    request: RequestProps | undefined;
    point: number[];
}

const settings = webmapSettings;
const wkt = new WKT();

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
        this.tool._overlayInfo(e, "popup", undefined);
        e.preventDefault();
    } else if (e.type === "singleclick" && e.originalEvent.ctrlKey === true) {
        this.tool._popupMultiple(e);
        e.preventDefault();
    } else if (e.type === "contextmenu" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
        this.tool._overlayInfo(e, "context", undefined);
        e.preventDefault();
    }
    return true;
};

export class IdentifyModule extends Component {
    private display: DojoDisplay;
    private displaySrid: number;
    private olmap: Map;
    private params: EventProps;
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
    private _urlParams: string;

    constructor(props: DojoDisplay) {
        super(props)

        this.display = props;
        this.displaySrid = 3857;
        this.olmap = this.display.map.olMap;
        this.control = new Control({ tool: this });
        this.control.setActive(false);
        this.olmap.addInteraction(this.control);

        this._urlParams = URL.getURLParams();

        this._addOverlay();

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

    _addOverlay = () => {
        this.overlay_popup = new Overlay({
            autoPan: true,
            stopEvent: true,
            autoPanAnimation: {
                duration: 250,
            },
        });
        this.olmap.addOverlay(this.overlay_popup);

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

    _popupMultiple = (e: MapBrowserEvent) => {
        alert(e.pixel);
    };

    displayFeatureInfo = async (event: MapBrowserEvent, op: string, fparams) => {

        const coords = await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: this.displaySrid,
                    srs_to: Object.keys(srsCoordinates).map(Number),
                    geom: wkt.writeGeometry(new Point(this.params.point)),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== this.displaySrid)
                const wktPoint = wkt.readGeometry(t.geom);
                const transformedCoord = wktPoint.getCoordinates();
                return transformedCoord;
            });
        let count;
        let response
        if (this.params.request !== null) {
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
                        this.params.request.styles.push({ id: item.styleId, label: item.label });
                    });
                })
            response = op === "popup" && await route("feature_layer.identify_module")
                .post({
                    json: this.params.request,
                })
                .then((response) => {
                    return response;
                });
            count = response.featureCount;
        } else {
            count = 0;
            response = { data: [], featureCount: 0 }
        }

        const offset = op === "popup" && fparams === undefined ?
            settings.offset_point : op === "popup" && fparams && fparams.value === "false" ?
                10 : 0;
        const position = positionContext(event, offset, op, count, settings, fparams);
        const coordValue = coords && coords[1].toFixed(6) + ", " + coords[0].toFixed(6);

        if (op === "context") {
            this._setValue(this.point_context, "context")
            this.root_context.render(<ContextComponent params={{ coordValue, position, event }} visible={this._visible} ref={this.refContext} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "context" });
        } else {
            this._visible({ hidden: true, overlay: undefined, key: "context" })
            this._setValue(this.point_popup, "popup");
            this.root_popup.render(<PopupComponent params={{ coordValue, position, response, event }} display={this.display} visible={this._visible} ref={this.refPopup} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "popup" });
        }
    };

    _isEditEnabled = (display, config) => {
        const pluginName = "ngw-webmap/plugin/FeatureLayer";

        if (display.isTinyMode() && !display.isTinyModePlugin(pluginName)) {
            return false;
        }

        const configLayerPlugin = config.plugin["ngw-webmap/plugin/FeatureLayer"];
        const readOnly = configLayerPlugin.readonly;
        return !readOnly;
    };

    _render = () => {
        this.display.identify_module.root_popup.render();
    };

    _overlayInfo = (e: MapBrowserEvent, op: string, fparams) => {
        const offHP = 40;
        const W = this.display.panelsManager._activePanelKey ?
            (window.innerWidth + this.display.leftPanelPane.w + 40) / 2 :
            (window.innerWidth + offHP) / 2;
        const H = (window.innerHeight + offHP) / 2;

        let simulateEvent = {
            coordinate: fparams && fparams.coordinate,
            map: this.olmap,
            target: 'map',
            pixel: [W, H],
            type: 'singleclick'
        };

        let request;
        if (op === "popup" && fparams === undefined) {
            request = {
                srs: this.displaySrid,
                geom: this._requestGeomString(e.pixel),
                styles: [],
            }
        }

        this.params = {
            point: fparams && fparams.value === "false" ? simulateEvent.coordinate : e.coordinate,
            request: fparams && fparams.value === "false" ? null : op === "context" ? null : request,
        }

        const event = fparams && fparams.value === "false" ? simulateEvent : e;
        this.displayFeatureInfo(event, op, fparams);
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

    identifyModuleUrlParams = async (lon, lat, attribute, lid, fid) => {
        if (attribute && attribute === "false") {
            this._responseContext(lon, lat, attribute);
        } else {
            this._responseContext(lon, lat, { lid, fid });
        }
        return true;
    };

    _responseContext = (lon, lat, value) => {
        const coordSwitcher = new CoordinateSwitcher({
            point: [lon, lat],
        });

        coordSwitcher._transformFrom(4326).then((transformedCoord) => {
            const fparams = { value, coordinate: transformedCoord };
            this._overlayInfo(null, "popup", fparams)
        })

    }
}
