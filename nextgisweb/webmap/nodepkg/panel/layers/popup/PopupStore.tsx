import { action, observable } from "mobx";
import { createRef } from "react";
import { createRoot } from "react-dom/client";
import { Map as olMap, MapBrowserEvent, Overlay } from "ol";
import { PointClick } from "@nextgisweb/webmap/icon";
import settings from "@nextgisweb/webmap/client-settings";
import topic from "@nextgisweb/webmap/compat/topic";
import { WKT } from "ol/format";
import { fromExtent } from "ol/geom/Polygon";
import { boundingExtent } from "ol/extent";
import { transform } from "ol/proj";
import { route } from "@nextgisweb/pyramid/api";

import type { Root as ReactRoot } from "react-dom/client";
import type { Display } from "@nextgisweb/webmap/display";
import type { EventProps, Response, Rnd, SizeWindowProps, SourceProps, StylesRequest } from "./type";

const array_context = [
    { key: 1, title: "Действие 1", result: "Действие 1 выполнено", visible: false },
    { key: 2, title: "Действие 2", result: "Действие 2 выполнено", visible: false },
    { key: 3, title: "Действие 3", result: "Действие 3 выполнено", visible: false },
    { key: 4, title: "Действие 4", result: "Действие 4 выполнено", visible: false },
];

const context_item = 34;
const length = array_context.filter(item => item.visible === true).length


export class PopupStore {
    display: Display;
    context_height: number;
    context_width: number;
    displaySrid: number;
    webMercator: string;
    LonLatSrid: number;
    wgs84: string;
    overlayPoint: Overlay;
    olmap: olMap;

    offHP: number;
    popup_height: number;
    popup_width: number;
    offset: number;
    coords_not_count_w: number;
    coords_not_count_h: number;

    pointElement = document.createElement("div");
    popupElement = document.createElement("div");
    contextElement = document.createElement("div");

    refContext = createRef<HTMLDivElement>();

    private rootPointClick: ReactRoot | null = null;

    @observable accessor isLandscape = false;
    @observable accessor isPortrait = false;
    @observable accessor popupHidden = true;
    @observable accessor contextHidden = true;
    @observable accessor isMobile = false;
    @observable accessor fixPopup = false;

    @observable.ref accessor params: EventProps;
    @observable.ref accessor countFeature: number;
    @observable.ref accessor response: Response;
    @observable.ref accessor sizeWindow: SizeWindowProps;
    @observable.ref accessor pointPopupClick: SourceProps;
    @observable.ref accessor pointContextClick: SourceProps;
    @observable.ref accessor valueRnd: Rnd;
    @observable.ref accessor fixPos: Rnd | null = null;
    @observable.ref accessor fixPanel: string | null = null;

    constructor({
        display,
        sizeWindow,
        fixPos,
        fixPanel,
    }) {
        this.display = display;
        this.fixPos = fixPos;
        this.fixPanel = fixPanel;
        this.context_height = 24 + context_item * length;
        this.context_width = 200;
        this.displaySrid = 3857;
        this.webMercator = "EPSG:3857";
        this.LonLatSrid = 4326;
        this.wgs84 = "EPSG:4326";
        this.sizeWindow = sizeWindow;
        this.olmap = this.display.map.olMap;

        this.pointElement.className = "point-click";
        this.rootPointClick = createRoot(this.pointElement);
        this.popupElement.className = "popup-position";
        this.contextElement.className = "context-position";

        this.offHP = !this.display.tinyConfig ? 40 : 0;
        this.popup_height = settings.popup_size.height;
        this.popup_width = settings.popup_size.width;
        this.offset = settings.offset_point;
        this.coords_not_count_w = 270;
        this.coords_not_count_h = 51;
        this._addOverlay();
    }

    @action
    setFixPos(fixPos: Rnd | null) {
        this.fixPos = fixPos;
    };

    @action
    setFixPanel(fixPanel: string) {
        this.fixPanel = fixPanel;
    };

    @action
    setParams(params: EventProps) {
        this.params = params;
    };

    @action
    setCountFeature(countFeature: number) {
        this.countFeature = countFeature;
    };

    @action
    setResponse(response: Response) {
        this.response = response;
    };

    @action
    setPopupHidden(popupHidden: boolean) {
        this.popupHidden = popupHidden;
    };

    @action
    setContextHidden(contextHidden: boolean) {
        this.contextHidden = contextHidden;
    };

    @action
    setFixPopup(fixPopup: boolean) {
        this.fixPopup = fixPopup;
    };

    @action
    setIsLandscape(isLandscape: boolean) {
        this.isLandscape = isLandscape;
    };

    @action
    setIsPortrait(isPortrait: boolean) {
        this.isPortrait = isPortrait;
    };

    @action
    setIsMobile(isMobile: boolean) {
        this.isMobile = isMobile;
    };

    @action
    setSizeWindow(sizeWindow: SizeWindowProps) {
        this.sizeWindow = sizeWindow;
    };

    @action
    setPointPopupClick(pointPopupClick: SourceProps) {
        this.pointPopupClick = pointPopupClick;
    };

    @action
    setPointContextClick(pointContextClick: SourceProps) {
        this.pointContextClick = pointContextClick;
    };

    @action
    setValueRnd(valueRnd: Rnd) {
        this.valueRnd = valueRnd;
    };

    _addOverlay = () => {
        this.overlayPoint = new Overlay({});
        this.olmap.addOverlay(this.overlayPoint);
        this.overlayPoint.setElement(this.pointElement);
    };

    renderPoint = (e) => {
        this.rootPointClick.render(<PointClick />);
        this.overlayPoint.setPosition(e.coordinate);
    };

    point_destroy = () => {
        topic.publish("feature.unhighlight");
        this.overlayPoint.setPosition(undefined);
        this.setValueRnd({ ...this.valueRnd, width: 0, height: 0, x: -9999, y: -9999 });
    };

    requestGeomString = (pixel: number[]) => {
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

    transformCoord = async (coord, from, to) => {
        return await transform(coord, from, to);
    };

    async overlayInfo(e: MapBrowserEvent, op: string, p) {
        const opts = this.display.config.options;
        const attr = opts["webmap.identification_attributes"];
        let requestProps: EventProps | undefined;
        if (op === "popup" && p === false) {
            await this.display.getVisibleItems()
                .then((items) => {
                    const styles: StylesRequest[] = [];
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
                    requestProps = {
                        point: e.coordinate,
                        request: {
                            srs: this.displaySrid,
                            geom: this.requestGeomString(e.pixel),
                            styles: styles,
                            point: this.olmap.getCoordinateFromPixel([e.pixel[0], e.pixel[1]]),
                            status: attr,
                            op: op,
                            p: p,
                        },
                    };
                })
        } else if (op === "popup" && p && p.value.attribute === true) {
            await this.display.getVisibleItems()
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
                    requestProps = {
                        point: e.coordinate,
                        request: {
                            srs: this.displaySrid,
                            geom: this.requestGeomString(this.olmap.getPixelFromCoordinate(p?.coordinate)),
                            styles: p.value.params,
                            point: p?.coordinate,
                            status: attr,
                            op: op,
                            p: p,
                        },
                    };
                })
        }

        return new Promise(resolve => resolve(requestProps));
    };

    async getResponse({ request }) {
        if (request.op === "popup") {
            const feature = await route("feature_layer.imodule")
                .post({
                    body: JSON.stringify(request),
                })
            return new Promise(resolve => resolve(feature));
        } else {
            return new Promise(resolve => resolve({ data: [], featureCount: 0 }));
        }
    }


    // displayFeatureInfo = async (event: MapBrowserEvent, op: string, p, mode) => {
    //     await this.getResponse(op, p);
    //     console.log(this.countFeature, this.response);

    // };
}