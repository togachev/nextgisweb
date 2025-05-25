import React, { Component, createRef } from "react";
import { createRoot } from "react-dom/client";
import { pointClick } from "./icons/icon";
import { Map as olMap, MapBrowserEvent, Overlay } from "ol";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import { Interaction } from "ol/interaction";
import { fromExtent } from "ol/geom/Polygon";
import { WKT } from "ol/format";
import { boundingExtent } from "ol/extent";
import { route } from "@nextgisweb/pyramid/api";
import { Point } from "ol/geom";
import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";
import { positionContext } from "./positionContext"
import OlGeomPoint from "ol/geom/Point";
import SimpleGeometry from 'ol/geom/SimpleGeometry';

import type { Display } from "@nextgisweb/webmap/display";
import type { DataProps, EventProps, ParamsProps, Params, Response, StylesRequest, UrlParamsProps, VisibleProps } from "./type";

import "./IModule.less";

const settings = webmapSettings;
const wkt = new WKT();

interface ControlOptions {
    tool: IModule;
}

class Control extends Interaction {
    private tool: IModule;

    constructor(options: ControlOptions) {
        super({
            handleEvent: (e) => this.handleClickEvent(e),
        });
        this.tool = options.tool;
    }

    handleClickEvent(e: MapBrowserEvent): boolean {
        if (e.type === "singleclick" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
            this.tool._overlayInfo(e, "popup", false, "click");
            e.preventDefault();
        }
        // else if (e.type === "singleclick" && e.originalEvent.shiftKey === true) {
        //     this.tool._popupMultiple(e, "multi", false);
        //     e.preventDefault();
        // }
        else if (e.type === "contextmenu" && e.originalEvent.ctrlKey === false && e.originalEvent.shiftKey === false) {
            this.tool._overlayInfo(e, "context", false, "click");
            e.preventDefault();
        }
        return true;
    }
}

const array_context = [ //для создания кнопок в контекстном меню
    { key: 1, title: "Действие 1", result: "Действие 1 выполнено", visible: false },
    { key: 2, title: "Действие 2", result: "Действие 2 выполнено", visible: false },
    { key: 3, title: "Действие 3", result: "Действие 3 выполнено", visible: false },
    { key: 4, title: "Действие 4", result: "Действие 4 выполнено", visible: false },
];

export class IModule extends Component {

    private display: Display;
    private displaySrid: number;
    private lonlat: number[];
    private response: Response;
    private countFeature: number;
    private offHP: number;
    private olmap: olMap;
    private params: EventProps;
    private selected: string | undefined;
    private overlay_popup: Overlay;
    private overlay_context: Overlay;
    private control: Interaction;
    private popup = document.createElement("div");
    private point_popup = document.createElement("div");
    private point_context = document.createElement("div");
    private root_popup = createRoot(this.popup);
    private root_context = createRoot(this.point_context);
    private refPopup = React.createRef<HTMLDivElement>();
    private refContext = createRef<HTMLDivElement>();

    constructor(props: Display) {
        super(props);

        this.display = props;
        this.displaySrid = 3857;
        this.offHP = !this.display.tinyConfig ? 40 : 0;
        this.olmap = this.display.map.olMap;
        this.control = new Control({ tool: this });
        this.control.setActive(false);
        this.olmap.addInteraction(this.control);

        this._addOverlay();

        this.point_popup = document.createElement("div");
        this.point_popup.innerHTML = `<span class="icon-position">${pointClick}</span>`;
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

    isNumeric = (string) => Number.isFinite(+string);

    getResponse = async (op: string, p) => {
        if (this.params.request !== undefined && (op === "popup" || p.value.attribute === true)) {
            await route("feature_layer.imodule")
                .post({
                    body: JSON.stringify(this.params.request),
                })
                .then(item => {
                    this.countFeature = item.featureCount;
                    this.response = { data: item.data, featureCount: item.featureCount };
                });
        } else {
            this.countFeature = 0;
            this.response = { data: [], featureCount: 0 };
        }
    }

    getLonLat = async () => {
        const srsInfo = await route("spatial_ref_sys.collection").get();
        const srsMap = new Map(srsInfo.map((s) => [s.id, s]));
        await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: this.displaySrid,
                    srs_to: Array.from(srsMap.keys()),
                    geom: wkt.writeGeometry(new Point(this.params.point)),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== this.displaySrid)
                const wktPoint = wkt.readGeometry(t.geom);
                if (wktPoint instanceof SimpleGeometry) {
                    const transformedCoord = wktPoint.getCoordinates();
                    const fixedArray = transformedCoord.map(number => parseFloat(number.toFixed(12)));
                    this.lonlat = fixedArray ? fixedArray : [];
                }
            });
    }

    displayFeatureInfo = async (event: MapBrowserEvent, op: string, p, mode) => {
        const offset = op === "context" ? 0 : settings.offset_point;

        await this.getResponse(op, p);
        const position = positionContext(event, offset, op, this.countFeature, settings, p, array_context, this.offHP);
        if (op === "popup") {
            if (this.display.config.identify_order_enabled) {
                this.response.data.sort((a, b) => Number(a.dop) - Number(b.dop));
            } else {
                if (!p) {
                    const orderObj = this.params.request.styles.reduce((a, c, i) => { a[c.id] = i; return a; }, {});
                    this.response.data.sort((l, r) => orderObj[l.styleId] - orderObj[r.styleId]);
                }
            }
            let value;
            if (mode === "click") {
                value = this.response.data[0];
            }
            else if (mode === "simulate") {
                value = this.response.data.find(x => x.value === this.selected) as DataProps;
            }

            this._visible({ hidden: true, overlay: undefined, key: "context" })
            this._setValue(this.point_popup, "popup");

            const propsPopup = {
                params: { mode: mode, op, position, response: this.response, selected: value },
                display: this.display,
                visible: this._visible,
            } as Params

            this.root_popup.render(<PopupComponent {...propsPopup} ref={this.refPopup} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "popup" });
        } else {
            this._setValue(this.point_context, "context")

            const propsContext = {
                params: { op, position },
                display: this.display,
                visible: this._visible
            } as Params

            this.root_context.render(<ContextComponent {...propsContext} ref={this.refContext} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "context" });
        }
    };

    _isEditEnabled = (display: Display, item) => {
        const pluginName = "@nextgisweb/webmap/plugin/feature-layer";

        if (display.isTinyMode() && !display.isTinyModePlugin(pluginName)) {
            return false;
        }

        const configLayerPlugin = item?.itemConfig.plugin["@nextgisweb/webmap/plugin/feature-layer"];
        const readOnly = configLayerPlugin?.readonly;
        return !readOnly;
    };

    _render = () => {
        this.display.imodule.root_popup.render();
    };

    // _popupMultiple = (e: MapBrowserEvent, op: string, p) => {
    //     console.log(e.pixel, op, p);
    // };

    _overlayInfo = async (e: MapBrowserEvent, op: string, p, mode) => {
        const opts = this.display.config.options;
        const attr = opts["webmap.identification_attributes"];
        let request;
        if (op === "popup" && p === false) {
            const styles: StylesRequest[] = [];
            this.display.getVisibleItems()
                .then((items) => {
                    const itemConfig = this.display.getItemConfig();
                    const mapResolution = this.olmap.getView().getResolution();
                    items.map(i => {
                        const item = itemConfig[i.id];
                        if (
                            !item.identifiable ||
                            mapResolution && mapResolution >= item.maxResolution ||
                            mapResolution && mapResolution < item.minResolution
                        ) {
                            return;
                        }
                        if (item.identification) {
                            styles.push({ id: item.styleId, label: item.label, dop: item.drawOrderPosition });
                        }
                    });
                })

            request = {
                srs: this.displaySrid,
                geom: this._requestGeomString(e.pixel),
                styles: styles,
                point: this.olmap.getCoordinateFromPixel([e.pixel[0], e.pixel[1]]),
                status: attr,
            }
        }

        if (op === "popup" && p && p.value.attribute === true) {
            this.display.getVisibleItems()
                .then((items) => {
                    const itemConfig = this.display.getItemConfig();
                    p.value.params.map(itm => {
                        items.some(x => {
                            if (itemConfig[x.id].styleId === itm.id) {
                                const label = items.find(x => itemConfig[x.id].styleId === itm.id).label;
                                const dop = items.find(x => itemConfig[x.id].styleId === itm.id).position;
                                itm.label = label;
                                itm.dop = dop;
                            }
                        });
                    })
                })

            request = {
                srs: this.displaySrid,
                geom: this._requestGeomString(this.olmap.getPixelFromCoordinate(p?.coordinate)),
                styles: p.value.params,
                point: p?.coordinate,
                status: attr,
            }
        }

        this.params = {
            point: e.coordinate,
            request: request,
        }

        await this.getLonLat();

        if (this.display.panelManager.getActivePanelName() !== "custom-layer") {
            this.displayFeatureInfo(e, op, p, mode);
        }
    };

    _requestGeomString = (pixel: number[]) => {
        const pixelRadius = settings.identify_radius;

        return new WKT().writeGeometry(
            fromExtent(
                boundingExtent([
                    this.olmap.getCoordinateFromPixel([pixel[0] - pixelRadius, pixel[1] - pixelRadius]),
                    this.olmap.getCoordinateFromPixel([pixel[0] + pixelRadius, pixel[1] + pixelRadius]),
                ])
            )
        )
    };

    iModuleUrlParams = async ({ lon, lat, attribute, st, slf, pn }: UrlParamsProps) => {
        const slf_ = new String(slf);
        if (attribute && attribute === "false") {
            this._responseContext({ lon, lat, attribute: false });
        } else if (slf_ instanceof String) {
            this._responseContext({ lon, lat, attribute: true, st, slf, pn });
        }
        return true;
    };

    _responseContext = async (val: UrlParamsProps) => {
        const srsInfo = await route("spatial_ref_sys.collection").get();
        const srsMap = new Map(srsInfo.map((s) => [s.id, s]));
        await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: 4326,
                    srs_to: Array.from(srsMap.keys()),
                    geom: wkt.writeGeometry(new OlGeomPoint([Number(val.lon), Number(val.lat)])),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== 4326)
                const wktPoint = wkt.readGeometry(t.geom);
                if (wktPoint instanceof SimpleGeometry) {
                    const transformedCoord = wktPoint.getCoordinates();
                    return transformedCoord;
                }
            })
            .then((transformedCoord) => {
                const params: ParamsProps[] = [];
                val.st?.split(",").map(i => {
                    params.push({
                        id: Number(i),
                        label: "",
                        dop: null,
                    });
                })

                this.selected = val.slf;

                const value = {
                    attribute: val.attribute,
                    pn: val.pn,
                    lon: val.lon,
                    lat: val.lat,
                    params,
                }

                const p = { value, coordinate: transformedCoord };
                const pixel = this.olmap.getPixelFromCoordinate(p.coordinate);
                const simulateEvent = {
                    coordinate: p && p.coordinate,
                    map: this.olmap,
                    target: "map",
                    pixel: [
                        this.display.panelManager.getActivePanelName() !== "none" ?
                            (pixel[0] + 340 + this.offHP) :
                            (pixel[0] + this.offHP), (pixel[1] + this.offHP)
                    ],
                    type: "singleclick"
                };

                this._overlayInfo(simulateEvent, "popup", p, "simulate")
            });
    };
}