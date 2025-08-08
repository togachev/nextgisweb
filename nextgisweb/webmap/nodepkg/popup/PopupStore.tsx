import { action, computed, observable } from "mobx";
import { Component } from "react";
import { createRoot } from "react-dom/client";
import { Map as olMap, MapBrowserEvent, Overlay } from "ol";

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
import { Popup } from "./component/Popup";
import { ContextComponent } from "./component/ContextComponent";
import { getPositionContext, getPosition } from "./util/function";
import UpdateLink from "@nextgisweb/icon/mdi/update";
import FitToScreenOutline from "@nextgisweb/icon/mdi/fit-to-screen-outline";
import LockReset from "@nextgisweb/icon/mdi/lock-reset";

import type SelectedFeatureStore from "@nextgisweb/webmap/panel/selected-feature/SelectedFeatureStore";
import type { Root as ReactRoot } from "react-dom/client";
import type { Display } from "@nextgisweb/webmap/display";
import type { AttributeProps, ContextProps, ControlUrlProps, DataProps, EventProps, ExtensionsProps, OptionProps, ParamsProps, Position, Response, Rnd, SizeWindowProps, SourceProps, StylesRequest, UrlParamsProps } from "./type";
import type { SizeType } from "@nextgisweb/gui/antd";

const forbidden = gettext("The data is not available for reading");

const array_context = [
    { key: 1, title: "Действие 1", result: "Действие 1 выполнено", visible: false },
    { key: 2, title: "Действие 2", result: "Действие 2 выполнено", visible: false },
    { key: 3, title: "Действие 3", result: "Действие 3 выполнено", visible: false },
    { key: 4, title: "Действие 4", result: "Действие 4 выполнено", visible: false },
];

const context_item = 34;
const length = array_context.filter(item => item.visible === true).length


export class PopupStore extends Component {
    display: Display;
    context_height: number;
    context_width: number;
    displaySrid: number;
    webMercator: string;
    lonLatSrid: number;
    wgs84: string;
    overlayPoint: Overlay;
    array_context: ContextProps[];
    olmap: olMap;

    offHP: number;
    popup_height: number;
    popup_width: number;
    offset: number;
    coords_not_count_w: number;
    coords_not_count_h: number;
    fX: number;
    fY: number;

    pointElement = document.createElement("div");
    popupElement = document.createElement("div");
    contextElement = document.createElement("div");

    rootPointClick: ReactRoot | null = null;
    rootPopup: ReactRoot | null = null;
    rootContext: ReactRoot | null = null;

    @observable accessor popupHidden = true;
    @observable accessor contextHidden = true;
    @observable accessor fixPopup = false;
    @observable accessor update = false;
    @observable accessor fullscreen = false;

    @observable.ref accessor params: EventProps;
    @observable.ref accessor response: Response;
    @observable.ref accessor sizeWindow: SizeWindowProps = {
        width: window.innerWidth,
        height: window.innerHeight,
    };
    @observable.ref accessor pointPopupClick: SourceProps;
    @observable.ref accessor pointContextClick: SourceProps;
    @observable.ref accessor valueRnd: Rnd;
    @observable.ref accessor pos: Position = { x: -9999, y: -9999, width: 0, height: 0 };
    @observable.ref accessor posContext: Position = { x: -9999, y: -9999, width: 0, height: 0 };
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
    @observable.ref accessor size: SizeType = "default";
    @observable.ref accessor currentUrlParams: string | null = null;

    constructor({
        display,
    }) {
        super(display);

        this.display = display;
        const urlParams = display.getUrlParams()
        const opts = display.config.options;
        const attrs = opts["webmap.identification_attributes"];
        const geoms = opts["webmap.identification_geometry"];
        this.fixPanel = urlParams.pn ? urlParams.pn :
            attrs === true ? "attributes" :
                attrs === false && geoms === true ? "geom_info" :
                    (attrs === false && geoms === false) && "description";
        this.control = {
            reset: {
                icon: <LockReset />,
                title: gettext("Reset url"),
                disable: true,
            },
            popup: {
                icon: <UpdateLink />,
                url: "",
                title: gettext("Update current web map address"),
                status: false,
                checked: false,
                disable: false,
            },
            fixedscreen: {
                icon: <FitToScreenOutline />,
                url: "",
                title: gettext("Set current map coverage"),
                status: false,
                checked: false,
                disable: false,
            }
        };
        this.array_context = array_context;
        this.context_height = 24 + context_item * length;
        this.context_width = 200;
        this.displaySrid = 3857;
        this.webMercator = "EPSG:3857";
        this.lonLatSrid = 4326;
        this.wgs84 = "EPSG:4326";

        this.olmap = this.display.map.olMap;

        this.pointElement.className = "point-click";
        this.rootPointClick = createRoot(this.pointElement);
        this.popupElement.className = "popup-position";
        this.rootPopup = createRoot(this.popupElement);
        this.contextElement.className = "context-position";
        this.rootContext = createRoot(this.contextElement);

        this.offHP = !this.display.tinyConfig ? 40 : 0;
        this.popup_height = settings.popup_size.height;
        this.popup_width = settings.popup_size.width;
        this.offset = settings.offset_point;
        this.coords_not_count_w = 270;
        this.coords_not_count_h = 51;
        this.fX = 0;
        this.fY = -40;

        this.addOverlay();
    }

    @computed
    get activePanel() {
        return this.display.panelManager.getActivePanelName();
    }

    @action
    setCurrentUrlParams(currentUrlParams: string) {
        this.currentUrlParams = currentUrlParams;
    };

    @action
    setSize(size: string) {
        this.size = size;
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

    @action
    setPos(pos: Rnd) {
        this.pos = pos;
    };

    @action
    setPosContext(posContext: Rnd) {
        this.posContext = posContext;
    };

    addOverlay() {
        this.overlayPoint = new Overlay({
            id: "point-click",
        });
        this.olmap.addOverlay(this.overlayPoint);
        this.overlayPoint.setElement(this.pointElement)
    };

    renderPoint(e) {
        const propsPoint = {
            params: { response: this.response, selected: this.selected },
            store: this,
            event: e,
            replaceContent: true,
        };
        this.rootPointClick.render(<PopupClick {...propsPoint} />);
        this.overlayPoint.setPosition(e.coordinate);
    };

    pointDestroy() {
        topic.publish("feature.unhighlight");
        this.overlayPoint.setPosition(undefined);
        this.rootPopup.render();
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

    async renderPopup(e) {
        if (e.type === "contextmenu") {
            const lonlat = transform(e.coordinate, this.webMercator, this.wgs84);
            this.setPointContextClick({
                typeEvents: "contextmenu",
                pixel: e.pixel,
                clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                coordinate: e.coordinate,
                lonlat: lonlat,
            });

            getPositionContext(e.originalEvent.clientX, e.originalEvent.clientY, this)
                .then(val => {
                    this.setPosContext(val);
                })
                .then(() => {
                    const propsContext = { store: this };
                    this.rootContext.render(<ContextComponent {...propsContext} />);
                    this.setContextHidden(false);
                });
        } else {
            await this.getResponse()
                .then(item => {
                    const orderObj = this.params.request?.styles.reduce((a, c, i) => { a[c.id] = i; return a; }, {});
                    const data = item.data.sort((l, r) => orderObj[l.styleId] - orderObj[r.styleId]);
                    this.setResponse({ data: data, featureCount: item.featureCount });
                    if (this.mode === "click") {
                        this.setSelected(data[0]);
                    } else if (this.mode === "simulate" || this.mode === "selected") {
                        const val = { ...data.find(x => x.value === this.params.request.p.value.selected) } as DataProps;
                        this.setSelected(val);
                    }

                    const pxy = this.mode === "simulate" || this.mode === "selected" ? e.pixel : [e.originalEvent.clientX, e.originalEvent.clientY];
                    const lonlat = transform(e.coordinate, this.webMercator, this.wgs84);
                    this.setPointPopupClick({
                        typeEvents: "click",
                        pixel: e.pixel,
                        clientPixel: pxy,
                        coordinate: e.coordinate,
                        lonlat: lonlat,
                    });
                    getPosition(pxy[0], pxy[1], this)
                        .then(val => {
                            this.setPos(val);
                            this.setValueRnd({
                                ...this.valueRnd, width: val?.width, height: val?.height, x: val?.x, y: val?.y - this.offHP,
                                pointClick: val?.pointClick,
                                buttonZoom: val?.buttonZoom,
                            });

                        })
                })
                .then(() => {
                    if (this.selected && Object.keys(this.selected).length === 0) {
                        this.pointDestroy();
                    } else {
                        this.contentGenerate();
                        this.renderPoint(e);
                        const propsPopup = { display: this.display, store: this };
                        this.rootPopup.render(<Popup {...propsPopup} />);
                        this.setContextHidden(true);
                        this.setPopupHidden(false);
                    }
                });
        }
    }

    async overlayInfo(e: MapBrowserEvent, props) {
        const opts = this.display.config.options;
        const attr = opts["webmap.identification_attributes"];
        this.setMode(props.type);

        if (e.type === "click") {
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

                    this.setParams({
                        point: e.coordinate,
                        request: {
                            srs: this.displaySrid,
                            geom: this.requestGeomString(e.pixel),
                            styles: styles,
                            point: e.coordinate,
                            status: attr,
                            p: props.p,
                        },
                    });
                    return this.renderPopup(e);
                })
        }
        else if (e.type === "contextmenu") {
            this.renderPopup(e);
        }
        else if (e.type === "simulate" || e.type === "selected") {
            await this.display.getVisibleItems()
                .then((items) => {
                    const itemConfig = this.display.getItemConfig();
                    props.p.value.params.map(itm => {
                        items.some(x => {
                            if (itemConfig[x.id].styleId === itm.id) {
                                const label = items.find(x => itemConfig[x.id].styleId === itm.id).label;
                                const dop = items.find(x => itemConfig[x.id].styleId === itm.id).position;
                                itm.label = label;
                                itm.dop = dop;
                            }
                        });
                    })
                    this.setParams({
                        point: e.coordinate,
                        request: {
                            srs: this.displaySrid,
                            geom: this.requestGeomString(this.olmap.getPixelFromCoordinate(props.p.coordinate)),
                            styles: props.p.value.params,
                            point: props.p.coordinate,
                            status: attr,
                            p: props.p,
                        },
                    });
                    return this.renderPopup(e);
                });
        }
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
            this.setPermalink(decodeURIComponent(permalink + "&panel=" + String(panel)));
        })
    }

    updateSelectFeatures(panel, data) {
        const obj = { ...panel.selectedFeatures };
        const [key] = getEntries(obj).filter(([_, val]) => val.styleId === data.styleId)[0];
        const value = {
            ...obj,
            [key]: {
                ...obj[key],
                ...{
                    items: {
                        ...obj[key].items,
                        [String(data.props.selected)]: data
                    }
                }
            }
        }

        getEntries(value)
            .map(([key, _]) => {
                if (Object.keys(value[key].items).length > 10) {
                    delete value[key].items[Object.keys(value[key].items)[0]];
                }
            });
        panel.setSelectedFeatures(value)
    };

    @computed
    get propsCoords() {
        const styles: string[] = [];
        this.display.getVisibleItems()
            .then((items) => {
                items.forEach((i) => {
                    const item = this.display.itemStore.dumpItem(i);
                    if (item.visibility === true) {
                        styles.push(item.styleId);
                    }
                });
            })
        const result = [...new Set(this.response.data.map(a => a.styleId))].sort();
        const params: ParamsProps[] = [];
        result.map(i => {
            params.push({
                id: Number(i),
                label: "",
                dop: null,
            });
        });


        const props = {
            attribute: true,
            pn: "attributes",
            lon: this.pointPopupClick.lonlat[0],
            lat: this.pointPopupClick.lonlat[1],
            selected: this.selected.value,
            params,
        };

        return {
            extent: this.display.map.olMap.getView().calculateExtent(),
            styles: styles,
            pointPopupClick: this.pointPopupClick,
            valueRnd: this.valueRnd,
            sizeWindow: this.sizeWindow,
            props,
            styleId: this.selected.styleId,
            selected: this.selected,
        };
    };

    async contentGenerate() {
        if (this.response.featureCount > 0) {
            const selectVal = { ...this.selected };
            selectVal.label = selectVal.permission === "Forbidden" ? forbidden : selectVal.label;
            this.getContent(selectVal, false);
            this.LinkToGeometry(selectVal);
            this.setValueRnd({ ...this.valueRnd, buttonZoom: { [Object.keys(this.valueRnd?.buttonZoom)[0]]: true } });

            const pm = this.display.panelManager;
            const pkey = "selected-feature";
            const panel = pm.getPanel<SelectedFeatureStore>(pkey);

            if (panel) {
                this.updateSelectFeatures(panel, this.propsCoords);
            }
        } else {
            this.generateUrl({ res: null, st: null, pn: null, disable: false });
            this.setSelected({});
            this.setLinkToGeometry("");
            topic.publish("feature.unhighlight");
            this.setValueRnd({ ...this.valueRnd, buttonZoom: { [Object.keys(this.valueRnd?.buttonZoom)[0]]: false } });
        }
    }

    async getResponse() {
        if (["click", "simulate", "selected"].includes(this.mode)) {
            const feature = await route("feature_layer.imodule")
                .post({
                    body: JSON.stringify(this.params.request),
                })
            return new Promise<Response>(resolve => resolve(feature));
        } else {
            return new Promise<Response>(resolve => resolve({ data: [], featureCount: 0 }));
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
            const [lon, lat] = this.pointPopupClick.lonlat.map(number => parseFloat(number.toFixed(12)));
            const webmapId = this.display.config.webmapId;
            const zoom = this.olmap.getView().getZoom();

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

    async pModuleUrlParams({ lon, lat, attribute, st, slf, pn }: UrlParamsProps) {
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
                const store = display.popupStore;
                const params: ParamsProps[] = [];
                val.st?.split(",").map(i => {
                    params.push({
                        id: Number(i),
                        label: "",
                        dop: null,
                    });
                });

                const value = {
                    attribute: val.attribute,
                    pn: val.pn,
                    lon: val.lon,
                    lat: val.lat,
                    selected: val.slf,
                    params,
                };

                const p = { point: true, value, coordinate: transformedCoord };
                const panelSize = store.activePanel !== "none" ? (display.isMobile ? 0 : display.panelSize) : 0;

                this.olmap.once("postrender", function (e) {
                    const pixel = e.map.getPixelFromCoordinate(p.coordinate);
                    const simulateEvent: any = {
                        coordinate: p && p.coordinate,
                        map: e.map,
                        target: "map",
                        pixel: [
                            pixel[0] + panelSize + store.offHP, pixel[1] + store.offHP
                        ],
                        type: "simulate"
                    };
                    store.overlayInfo(simulateEvent, { type: "simulate", p: p });
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

    checkPointExtent(p?: number[], e?: number[]) {
        const point = p ? p : this.pointPopupClick.coordinate
        const ext = e ? e: this.display.map.olMap.getView().calculateExtent();
        const min_x = Math.min(ext[0], ext[2])
        const max_x = Math.max(ext[0], ext[2])
        const min_y = Math.min(ext[1], ext[3])
        const max_y = Math.max(ext[1], ext[3])

        return (
            point[0] >= min_x &&
            point[0] <= max_x &&
            point[1] >= min_y &&
            point[1] <= max_y
        );
    }
}