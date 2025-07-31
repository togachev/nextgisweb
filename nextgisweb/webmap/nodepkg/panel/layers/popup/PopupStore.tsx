import { action, computed, observable } from "mobx";
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
import { getEntries } from "./util/function";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { fieldValuesToDataSource, getFieldsInfo } from "@nextgisweb/webmap/panel/identify/fields";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { getPermalink } from "@nextgisweb/webmap/utils/permalink";
import OlGeomPoint from "ol/geom/Point";
import PopupClick from "./component/PopupClick";
import { getPosition } from "./util/function";

import type { Root as ReactRoot } from "react-dom/client";
import type { Display } from "@nextgisweb/webmap/display";
import type { AttributeProps, DataProps, ControlUrlProps, ExtensionsProps, EventProps, OptionProps, ParamsProps, Response, Rnd, SizeWindowProps, SourceProps, StylesRequest, UrlParamsProps } from "./type";

const forbidden = gettext("The data is not available for reading");

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
    lonLatSrid: number;
    wgs84: string;
    overlayPoint: Overlay;
    olmap: olMap;

    offHP: number;
    popup_height: number;
    popup_width: number;
    offset: number;
    coords_not_count_w: number;
    coords_not_count_h: number;
    wp: number;
    hp: number;
    fX: number;
    fY: number;

    pointElement = document.createElement("div");
    popupElement = document.createElement("div");
    contextElement = document.createElement("div");

    refContext = createRef<HTMLDivElement>();

    private rootPointClick: ReactRoot | null = null;

    @observable accessor isLandscape: boolean;
    @observable accessor isPortrait: boolean;
    @observable accessor popupHidden = true;
    @observable accessor contextHidden = true;
    @observable accessor isMobile: boolean;
    @observable accessor fixPopup = false;
    @observable accessor update = false;
    @observable accessor fullscreen = false;

    @observable.ref accessor params: EventProps;
    @observable.ref accessor response: Response;
    @observable.ref accessor sizeWindow: SizeWindowProps;
    @observable.ref accessor pointPopupClick: SourceProps;
    @observable.ref accessor pointContextClick: SourceProps;
    @observable.ref accessor valueRnd: Rnd;
    @observable.ref accessor fixPos: Rnd | null = null;
    @observable.ref accessor fixPanel: string | null = null;
    @observable.ref accessor selected: DataProps;
    @observable.ref accessor contextUrl: string | null = null;
    @observable.ref accessor extensions: ExtensionsProps | null = null;
    @observable.ref accessor attribute: AttributeProps[] = [];
    @observable.ref accessor linkToGeometry: string | null = null;
    @observable.ref accessor fixContentItem: OptionProps;
    @observable.ref accessor control: ControlUrlProps;
    @observable.ref accessor permalink: string | null = null;
    @observable.ref accessor activeControlKey: string;
    @observable.ref accessor mode: string;
    @observable.ref accessor currentUrlParams: string | null = null;

    constructor({
        display,
        sizeWindow,
        fixPos,
        fixPanel,
        control,
        isMobile,
        isLandscape,
        isPortrait,
    }) {
        this.display = display;
        this.display.popupStore = this;
        this.fixPos = fixPos;
        this.isMobile = isMobile;
        this.isLandscape = isLandscape;
        this.isPortrait = isPortrait;
        this.fixPanel = fixPanel;
        this.control = control;
        this.context_height = 24 + context_item * length;
        this.context_width = 200;
        this.displaySrid = 3857;
        this.webMercator = "EPSG:3857";
        this.lonLatSrid = 4326;
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
        this.fX = this.offHP + this.offset;
        this.fY = this.offset;
        this.wp = window.innerWidth - this.offHP - this.offset * 2;
        this.hp = window.innerHeight - this.offHP - this.offset * 2;
        this._addOverlay();
    }

    @action
    setCurrentUrlParams(currentUrlParams: string) {
        this.currentUrlParams = currentUrlParams;
    };

    @action
    setMode(mode: string) {
        this.mode = mode;
    };

    @action
    setActiveControlKey(activeControlKey: string) {
        this.activeControlKey = activeControlKey;
    };

    @action
    setPermalink(permalink: string) {
        this.permalink = permalink;
    };

    @action
    setControl(control: ControlUrlProps) {
        this.control = control;
    };

    @action
    setFixContentItem(fixContentItem: OptionProps) {
        this.fixContentItem = fixContentItem;
    };

    @action
    setFullscreen(fullscreen: boolean) {
        this.fullscreen = fullscreen;
    };

    @action
    setLinkToGeometry(linkToGeometry: string) {
        this.linkToGeometry = linkToGeometry;
    };

    @action
    setAttribute(attribute: AttributeProps[]) {
        this.attribute = attribute;
    };

    @action
    setExtensions(extensions: ExtensionsProps) {
        this.extensions = extensions;
    };

    @action
    setContextUrl(contextUrl: string) {
        this.contextUrl = contextUrl;
    };

    @action
    setUpdate(update: boolean) {
        this.update = update;
    };

    @action
    setSelected(selected: DataProps) {
        this.selected = selected;
    };

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

    @computed
    get activePanel() {
        return this.display.panelManager.getActivePanelName();
    }

    _addOverlay() {
        this.overlayPoint = new Overlay({});
        this.olmap.addOverlay(this.overlayPoint);
        this.overlayPoint.setElement(this.pointElement);
    };

    renderPoint(e) {
        this.rootPointClick.render(<PointClick />);
        this.overlayPoint.setPosition(e.coordinate);
    };

    pointDestroy() {
        topic.publish("feature.unhighlight");
        this.overlayPoint.setPosition(undefined);
        this.setValueRnd({ ...this.valueRnd, width: 0, height: 0, x: -9999, y: -9999 });
    };

    requestGeomString(pixel: number[]) {
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

    async transformCoord(coord, from, to) {
        return await transform(coord, from, to);
    };

    async overlayInfo(e: MapBrowserEvent, op: string, p) {
        const opts = this.display.config.options;
        const attr = opts["webmap.identification_attributes"];
        let requestProps: EventProps;
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
            this.setMode("simulate");
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
                    const params = {
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
                    this.getResponse(params)
                        .then(item => {
                            this.setResponse({ data: item.data, featureCount: item.featureCount });
                            this.setSelected(item.data[0]);
                        })
                        .then(() => {
                            getPosition(this.display, this.activePanel !== "none" ? e.pixel[0] + this.display.panelSize : e.pixel[0], e.pixel[1], this)
                                .then(val => {
                                    this.setValueRnd({
                                        ...this.valueRnd, width: val?.width, height: val?.height, x: val?.x + this.offHP, y: val?.y,
                                        pointClick: val?.pointClick,
                                        buttonZoom: val?.buttonZoom,
                                    });
                                    this.contentGenerate();
                                })
                            this.renderPoint(e);

                            this.setPointPopupClick({
                                typeEvents: "click",
                                pixel: e.pixel,
                                clientPixel: e.pixel,
                                coordinate: e.coordinate,
                                lonlat: [params.request.p.value.lon, params.request.p.value.lat],
                            });
                            this.setPopupHidden(false);
                        })
                })
        }

        return new Promise(resolve => resolve(requestProps));
    };



    async LinkToGeometry(value: DataProps) {
        const styles: number[] = [];
        const items = await this.display.getVisibleItems();
        items.map(i => {
            styles.push(i.styleId);
        });

        value.type === "vector" ?
            this.setLinkToGeometry("v:" + value.layerId + ":" + value.id + ":" + styles) :
            this.setLinkToGeometry("r:" + value.layerId + ":" + value.styleId + ":" + styles)
    }
    async updatePermalink() {
        const display = this.display
        await display.getVisibleItems().then((visibleItems) => {
            const permalink = getPermalink({ display, visibleItems });
            const panel = this.activePanel === "share" ? "layers" : this.activePanel && this.activePanel !== "share" ? this.activePanel : "none";
            this.setPermalink(decodeURIComponent(permalink + '&panel=' + String(panel)));
        })
    }

    async contentGenerate(value) {
        if (this.response.featureCount > 0) {
            const selectVal = value ? value : this.selected;
            selectVal.label = selectVal.permission === "Forbidden" ? forbidden : selectVal.label;
            this.getContent(selectVal, false);
            this.LinkToGeometry(selectVal);
            this.setValueRnd({ ...this.valueRnd, buttonZoom: { [Object.keys(this.valueRnd?.buttonZoom)[0]]: true } });
        } else {
            this.generateUrl({ res: null, st: null, pn: null, disable: false });
            this.setSelected({});
            this.setLinkToGeometry("");
            topic.publish("feature.unhighlight");
            this.setValueRnd({ ...this.valueRnd, buttonZoom: { [Object.keys(this.valueRnd?.buttonZoom)[0]]: false } });
        }
    }

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

    async getAttribute(res: DataProps, key) {
        const opts = this.display.config.options;
        const attrs = opts["webmap.identification_attributes"];

        const resourceId = res.permission !== "Forbidden" ? res.layerId : -1;
        const item = getEntries(this.display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.layerId === res.layerId)?.[1];
        const geom = item && item.itemConfig.layerHighligh === true ? true : false;
        const query = { geom: geom, dt_format: "iso" };

        attrs === false && Object.assign(query, { fields: attrs })

        const feature = res.permission !== "Forbidden" ? await route("feature_layer.feature.item", {
            id: resourceId,
            fid: res.id,
        })
            .get({
                cache: !key ? true : false,
                query,
            })
            .then(item => {
                return item;
            }) :
            {
                id: -1,
                geom: "POINT EMPTY",
                fields: { Forbidden: "Forbidden" },
                extensions: null
            }

        if (res.permission !== "Forbidden") {
            const fieldsInfo = await getFieldsInfo(resourceId, false);
            const { fields } = feature;
            const abortController = new AbortController();
            const dataSource = fieldValuesToDataSource(fields, fieldsInfo, {
                signal: abortController.signal,
            });
            return { dataSource, feature, resourceId };
        } else {
            return { updateName: undefined, feature: feature, resourceId: -1 };
        }
    }

    async generateUrl({ res, st, pn, disable }) {
        if (this.pointPopupClick) {
            const [lon, lat] = this.pointPopupClick?.lonlat?.map(number => parseFloat(number.toFixed(12)));
            const webmapId = this.display.config.webmapId;
            const zoom = this.display.map.zoom;

            this.display.getVisibleItems()
                .then((items) => {
                    const styles: string[] = [];
                    items.forEach((i) => {
                        const item = this.display.itemStore.dumpItem(i);
                        if (item.visibility === true) {
                            styles.push(item.styleId);
                        }
                    });

                    const selected = res?.type === "raster" ? [res?.styleId + ":" + res?.layerId + ":" + lon + ":" + lat] : [res?.styleId + ":" + res?.layerId + ":" + res?.id];
                    const result = [...new Set(st?.map(a => a.styleId))].sort();

                    const panel = this.display.panelManager.getActivePanelName();

                    const obj = disable ?
                        { attribute: false, lon, lat, zoom, styles: styles, st: result, slf: selected, pn: pn, base: this.display.map.baseLayer?.name } :
                        res ?
                            { attribute: true, lon, lat, zoom, styles: styles, st: result, slf: selected, pn: pn, base: this.display.map.baseLayer?.name } :
                            { attribute: false, lon, lat, zoom, styles: styles, base: this.display.map.baseLayer?.name };

                    panel !== "share" && Object.assign(obj, { panel: panel });

                    const paramsUrl = new URLSearchParams();

                    Object.entries(obj)?.map(([key, value]) => {
                        paramsUrl.append(key, value);
                    })

                    const url = routeURL("webmap.display", webmapId);
                    const link = origin + url + "?" + paramsUrl.toString();

                    this.setContextUrl(decodeURIComponent(link));
                })
        }
    };

    async getContent(val: DataProps, key: boolean) {
        if (val.type === "vector") {
            const res = await this.getAttribute(val, key);
            this.setExtensions(res.feature.extensions);

            res?.dataSource?.then(i => {
                this.setAttribute(i);
            });

            const highlights = getEntries(this.display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.layerId === val.layerId)?.[1].itemConfig.layerHighligh;

            highlights === true ?
                topic.publish("feature.highlight", {
                    geom: res.feature.geom,
                    featureId: res.feature.id,
                    layerId: res.resourceId,
                }) :
                topic.publish("feature.unhighlight")

            this.generateUrl({ res: val, st: this.response.data, pn: this.fixPanel, disable: false });

            if (key === true) {
                this.setUpdate(false);
            }
        }
        else if (val.type === "raster") {
            this.setAttribute(val.attr);
            this.generateUrl({ res: val, st: this.response.data, pn: this.fixPanel, disable: false });
            topic.publish("feature.unhighlight");
            if (key === true) {
                this.setUpdate(false);
            }
        }
    }

    async iModuleUrlParams({ lon, lat, attribute, st, slf, pn }: UrlParamsProps) {
        const slf_ = new String(slf);
        if (attribute && attribute === "false") {
            await this.responseContext({ lon, lat, attribute: false });
        } else if (slf_ instanceof String) {
            await this.responseContext({ lon, lat, attribute: true, st, slf, pn })
        }
        return true;
    };

    async responseContext(val: UrlParamsProps) {
        await this.transformCoord([Number(val.lon), Number(val.lat)], this.wgs84, this.webMercator)
            .then((transformedCoord) => {
                const display = this.display;
                const params: ParamsProps[] = [];
                val.st?.split(",").map(i => {
                    params.push({
                        id: Number(i),
                        label: "",
                        dop: null,
                    });
                })

                this.setSelected(val.slf);

                const value = {
                    attribute: val.attribute,
                    pn: val.pn,
                    lon: val.lon,
                    lat: val.lat,
                    params,
                }

                const p = { point: true, value, coordinate: transformedCoord };

                this.olmap.once("postrender", function (e) {
                    const pixel = e.map.getPixelFromCoordinate(p.coordinate);
                    const simulateEvent: any = {
                        coordinate: p && p.coordinate,
                        map: e.map,
                        target: "map",
                        pixel: pixel,
                        type: "click"
                    };
                    display.popupStore.overlayInfo(simulateEvent, "popup", p)
                });
            });
    };

    zoomTo(val) {
        if (!val) return;
        this.display.featureHighlighter
            .highlightFeatureById(val.id, val.layerId)
            .then((feature) => {
                this.display.map.zoomToFeature(feature);
            });
    };

    zoomToExtent(extent) {
        this.display.map.zoomToExtent(extent, {
            displayProjection: this.display.displayProjection,
        });
    };

    async zoomToLayerExtent(val) {
        const { extent } = await route("layer.extent", {
            id: val?.styleId,
        }).get({ cache: true });

        this.display.map.zoomToNgwExtent(extent, {
            displayProjection: this.display.displayProjection,
        });
        topic.publish("update.point", true);
    };

    zoomToPoint(val) {
        if (!val) return;
        const point = new OlGeomPoint(val);
        this.display.map.zoomToExtent(point.getExtent());
    };

    isEditEnabled(display: Display, item) {
        const pluginName = "@nextgisweb/webmap/plugin/feature-layer";

        if (display.isTinyMode() && !display.isTinyModePlugin(pluginName)) {
            return false;
        }

        const configLayerPlugin = item?.itemConfig.plugin["@nextgisweb/webmap/plugin/feature-layer"];
        const readOnly = configLayerPlugin?.readonly;
        return !readOnly;
    };
}