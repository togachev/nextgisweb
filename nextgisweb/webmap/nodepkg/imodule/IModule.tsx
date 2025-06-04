import { action, computed, observable } from "mobx";
import { Component, createRef } from "react";
import { createRoot } from "react-dom/client";
import type { Root as ReactRoot } from 'react-dom/client';
import { Map as olMap, MapBrowserEvent, Overlay } from "ol";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import { Interaction } from "ol/interaction";
import { fromExtent } from "ol/geom/Polygon";
import { WKT } from "ol/format";
import { boundingExtent } from "ol/extent";
import { route } from "@nextgisweb/pyramid/api";
import { Point } from "ol/geom";
import PopupClick from "./component/PopupClick";
import PopupComponent from "./component/PopupComponent";
import ContextComponent from "./component/ContextComponent";
import { positionContext } from "./positionContext"
import SimpleGeometry from "ol/geom/SimpleGeometry";
import topic from "@nextgisweb/webmap/compat/topic";

import type { Display } from "@nextgisweb/webmap/display";
import type { DataProps, EventProps, ParamsProps, Params, Response, StylesRequest, UrlParamsProps, VisibleProps } from "./type";
import type { SRSRead } from "@nextgisweb/spatial-ref-sys/type/api";

import "./IModule.less";

type SrsInfoMap = Map<number, SRSRead>;

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
        this.handleTouchEvent();
    }

    /* ---------- listen for single-click event or context menu for the touch screen ----------*/
    handleTouchEvent() {
        const olmal = this.tool.display.map.olMap;
        const view = olmal.getViewport();
        view.addEventListener("click", (e: any) => {
            if (e.ctrlKey === false && e.shiftKey === false && e.pointerType === "touch") {
                e.preventDefault();
                this.tool.getPixels(e)
                    .then(pixel => {
                        e.pixel = pixel;
                        e.coordinate = olmal.getCoordinateFromPixel(pixel);
                        this.tool._overlayInfo(e, "popup", false, "click");
                    });
            }
        });
        view.addEventListener("contextmenu", (e: any) => {
            if (e.ctrlKey === false && e.shiftKey === false && e.pointerType === "touch") {
                e.preventDefault();
                this.tool.getPixels(e)
                    .then(pixel => {
                        e.pixel = pixel;
                        e.coordinate = olmal.getCoordinateFromPixel(pixel);
                        this.tool._overlayInfo(e, "context", false, "click");
                    });
            }
        });
    }

    handleClickEvent(e: MapBrowserEvent): boolean {
        if (
            e.type === "singleclick"
            && e.originalEvent.ctrlKey === false
            && e.originalEvent.shiftKey === false
            && e.originalEvent.pointerType === "mouse"
        ) {
            this.tool._overlayInfo(e, "popup", false, "click");
            e.preventDefault();
        } else if (
            e.type === "contextmenu"
            && e.originalEvent.ctrlKey === false
            && e.originalEvent.shiftKey === false
            && e.originalEvent.pointerType === "mouse"
        ) {
            this.tool._overlayInfo(e, "context", false, "click");
            e.preventDefault();
        }
        return true;
    }
}

/* to create buttons in the context menu */
const array_context = [
    { key: 1, title: "Действие 1", result: "Действие 1 выполнено", visible: false },
    { key: 2, title: "Действие 2", result: "Действие 2 выполнено", visible: false },
    { key: 3, title: "Действие 3", result: "Действие 3 выполнено", visible: false },
    { key: 4, title: "Действие 4", result: "Действие 4 выполнено", visible: false },
];

export class IModule extends Component {

    display: Display;
    displaySrid: number;
    LonLatSrid: number;
    lonlat: number[];
    response: Response;
    countFeature: number;
    offHP: number;
    olmap: olMap;
    params: EventProps;
    selected: string | undefined;
    overlay_popup: Overlay;
    overlay_context: Overlay;
    control: Interaction;

    point_click = document.createElement("div");
    popup = document.createElement("div");
    point_context = document.createElement("div");

    refPopup = createRef<HTMLDivElement>();
    refContext = createRef<HTMLDivElement>();

    private root_point_click: ReactRoot | null = null;
    private root_popup: ReactRoot | null = null;
    private root_point_context: ReactRoot | null = null;

    @observable.ref accessor srsMap: SrsInfoMap;

    constructor(display: Display) {
        super(display);

        this.display = display;
        this.displaySrid = 3857;
        this.LonLatSrid = 4326;
        this.offHP = !this.display.tinyConfig ? 40 : 0;
        this.olmap = this.display.map.olMap;
        this.control = new Control({ tool: this });
        this.control.setActive(false);
        this.olmap.addInteraction(this.control);
        this.getSrsInfo();
        this._addOverlay();

        this.root_point_click = createRoot(this.point_click);
        this.root_popup = createRoot(this.popup);
        this.root_point_context = createRoot(this.point_context);
    };

    activate = () => {
        this.control.setActive(true);
    };

    deactivate = () => {
        this.control.setActive(false);
    };

    @action
    private setSrsMap(srsMap: SrsInfoMap) {
        this.srsMap = srsMap;
    }

    @computed
    get _activePanel() {
        return this.display.panelManager.getActivePanelName();
    }

    @computed
    get _panelSize() {
        return this._activePanel && this._activePanel !== "none" ? this.display.panelSize : 0;
    }

    getSrsInfo = async () => {
        await route("spatial_ref_sys.collection").get()
            .then(srsInfo => {
                this.setSrsMap(new Map(srsInfo.map((s) => [s.id, s])));
                return srsInfo;
            })
    }

    getPixels = async (e) => {
        const activePanel = this.display.panelManager.getActivePanelName()
        const pixel = [
            activePanel && activePanel !== "none" ?
                e.clientX - this.display.panelSize - this.offHP :
                e.clientX - this.offHP,
            e.clientY - this.offHP
        ];
        return pixel;
    }

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

    displayFeatureInfo = async (event: MapBrowserEvent, op: string, p, mode) => {
        const offset = op === "context" ? 0 : settings.offset_point;

        await this.getResponse(op, p);
        const position = positionContext(event, offset, op, this.countFeature, settings, p, array_context, this.offHP);
        if (op === "popup") {
            if (this.display.config.identify_order_enabled) {
                this.response.data.sort((a, b) => Number(a.dop) - Number(b.dop));
            } else {
                if (!p) {
                    const orderObj = this.params.request?.styles.reduce((a, c, i) => { a[c.id] = i; return a; }, {});
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
            this._setValue(this.point_click, "popup");

            const propsPoint = {
                params: { response: this.response, selected: value },
                display: this.display,
                countFeature: this.countFeature,
                event: event,
            } as Params;

            const propsPopup = {
                params: { mode: mode, op, position, response: this.response, selected: value },
                display: this.display,
                visible: this._visible,
            } as Params;


            this.root_point_click.render(<PopupClick {...propsPoint} />);
            this.root_popup.render(<PopupComponent {...propsPopup} ref={this.refPopup} />);
            this._visible({ hidden: false, overlay: this.params.point, key: "popup" });
        } else {
            this._setValue(this.point_context, "context")

            const propsContext = {
                params: { op, position },
                display: this.display,
                visible: this._visible,
                array_context: array_context,
            } as Params;

            this.root_point_context.render(<ContextComponent {...propsContext} ref={this.refContext} />);
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

    transformCoordinate = async (from, to, point) => {
        return await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: from,
                    srs_to: Array.from(to),
                    geom: wkt.writeGeometry(new Point(point)),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== from)
                const wktPoint = wkt.readGeometry(t.geom);
                if (wktPoint instanceof SimpleGeometry) {
                    const transformedCoord = wktPoint.getCoordinates() as number[];
                    return transformedCoord;
                }
            });
    };

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

        await this.transformCoordinate(this.displaySrid, this.srsMap.keys(), this.params.point)
            .then((transformedCoord) => {
                const fixedArray = transformedCoord.map(number => parseFloat(number.toFixed(12)));
                this.lonlat = fixedArray ? fixedArray : [];
            })

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
            await this.responseContext({ lon, lat, attribute: false });
        } else if (slf_ instanceof String) {
            await this.responseContext({ lon, lat, attribute: true, st, slf, pn })
        }
        return true;
    };

    async responseContext(val: UrlParamsProps) {
        const srsInfo = await route("spatial_ref_sys.collection").get()
            .then(srsInfo => {
                return new Map(srsInfo.map((s) => [s.id, s]));
            })
        await this.transformCoordinate(this.LonLatSrid, srsInfo.keys(), [Number(val.lon), Number(val.lat)])
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
                const simulateEvent: any = {
                    coordinate: p && p.coordinate,
                    map: this.olmap,
                    target: "map",
                    pixel: [
                        this.display.panelManager.getActivePanelName() !== "none" ?
                            (pixel[0] + this.display.panelSize + this.offHP) :
                            (pixel[0] + this.offHP), (pixel[1] + this.offHP)
                    ],
                    type: "click"
                };

                this._overlayInfo(simulateEvent, "popup", p, "simulate")
            });
    };

    zoomTo(val) {
        if (!val) return;
        this.display.featureHighlighter
            .highlightFeatureById(val.id, val.layerId)
            .then((feature) => {
                this.display.map.zoomToFeature(feature);
                topic.publish("update.point", true);
            });
    };

    async zoomToRasterExtent(val) {
        const { extent } = await route("layer.extent", {
            id: val?.styleId,
        }).get({ cache: true });

        this.display.map.zoomToNgwExtent(extent, {
            displayProjection: this.display.displayProjection,
        });
        topic.publish("update.point", true);
    };
};