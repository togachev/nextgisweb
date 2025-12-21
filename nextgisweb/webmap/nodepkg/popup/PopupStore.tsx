import { action, computed, observable, reaction } from "mobx";
import { createRoot } from "react-dom/client";
import { MapBrowserEvent, Overlay } from "ol";

import settings from "@nextgisweb/webmap/client-settings";
import topic from "@nextgisweb/webmap/compat/topic";
import { WKT } from "ol/format";
import { fromExtent } from "ol/geom/Polygon";
import Interaction from "ol/interaction/Interaction";
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
import type { MapStore } from "@nextgisweb/webmap/ol/MapStore";
import type { Display } from "@nextgisweb/webmap/display";
import type { AttributeProps, ContextProps, ControlUrlProps, DataProps, EventProps, ExtensionsProps, OptionProps, ParamsProps, Position, Response, Rnd, SizeWindowProps, SourceProps, StylesRequest, UrlParamsProps } from "./type";
import type { SizeType } from "@nextgisweb/gui/antd";
import type { FitOptions } from "ol/View";

const forbidden = gettext("The data is not available for reading");

const array_context = [
    { key: 1, title: "Действие 1", result: "Действие 1 выполнено", visible: false },
    { key: 2, title: "Действие 2", result: "Действие 2 выполнено", visible: false },
    { key: 3, title: "Действие 3", result: "Действие 3 выполнено", visible: false },
    { key: 4, title: "Действие 4", result: "Действие 4 выполнено", visible: false },
];

const context_item = 34;
const length = array_context.filter(item => item.visible === true).length

interface PopupOptions {
    display: Display;
}

export class PopupStore {
    label = gettext("PopupStore");
    map: MapStore;
    display: Display;

    context_height: number;
    context_width: number;
    displaySrid: number;
    lonLatSrid: number;
    overlayPoint: Overlay;
    array_context: ContextProps[];

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
    @observable.ref accessor activeFeatureData: string | null = null;
    @observable.ref accessor extensions: ExtensionsProps | null = null;
    @observable.ref accessor attribute: AttributeProps[] = [];
    @observable.ref accessor linkToGeometry: string | null = null;
    @observable.ref accessor fixContentItem: OptionProps;

    @observable.ref accessor active = true;
    @observable.ref accessor control: Interaction | null = null;

    @observable.ref accessor controls: ControlUrlProps;
    @observable.ref accessor permalink: string | null = null;
    @observable.ref accessor activeControlKey: string | null = null;
    @observable.ref accessor mode: string;
    @observable.ref accessor size: SizeType = "default";
    @observable.ref accessor currentUrlParams: string | null = null;

    constructor(options: PopupOptions) {
        this.display = options.display;
        this.map = this.display.map;

        reaction(
            () => this.control,
            (ctrl, prev) => {
                const olMap = this.display.map.olMap;
                if (prev) {
                    olMap.removeInteraction(prev);
                }
                if (ctrl) {
                    olMap.addInteraction(ctrl);
                    ctrl.setActive(this.active);
                }
            },
            { fireImmediately: false }
        );

        reaction(
            () => this.active,
            (isActive) => {
                if (this.control) {
                    this.control.setActive(isActive);
                }
            }
        );

        const urlParams = this.display.urlParams;
        const opts = this.display.config.options;
        const attrs = opts["webmap.identification_attributes"];
        const geoms = opts["webmap.identification_geometry"];
        this.fixPanel = urlParams.pn ? urlParams.pn :
            attrs === true ? "attributes" :
                attrs === false && geoms === true ? "geom_info" :
                    (attrs === false && geoms === false) && "description";
        this.controls = {
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
        this.lonLatSrid = 4326;

        this.pointElement.className = "point-click";
        this.rootPointClick = createRoot(this.pointElement);
        this.popupElement.className = "popup-position";
        this.rootPopup = createRoot(this.popupElement);
        this.contextElement.className = "context-position";
        this.rootContext = createRoot(this.contextElement);

        this.offHP = !this.display.isTinyMode ? 40 : 0;
        this.popup_height = settings.popup_size.height;
        this.popup_width = settings.popup_size.width;
        this.offset = settings.offset_point;
        this.coords_not_count_w = 270;
        this.coords_not_count_h = 51;
        this.fX = 0;
        this.fY = this.display.isTinyMode ? 0 : -40;

        this.addOverlay();
    }

    @action.bound
    setControl(control: Interaction | null) {
        this.control = control;
    }

    @action.bound
    activate(): void {
        this.active = true;
    }

    deactivate(): void {
        this.active = false;
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
    setControls(controls: ControlUrlProps) {
        this.controls = controls;
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
    setActiveFeatureData(activeFeatureData: string) {
        this.activeFeatureData = activeFeatureData;
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
        this.map.olMap.addOverlay(this.overlayPoint);
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
        this.display.highlighter.unhighlight();
        this.overlayPoint.setPosition(undefined);
        this.rootPopup.render();
    };

    requestGeomString(pixel: number[]) {
        const pixelRadius = settings.identify_radius;

        return new WKT().writeGeometry(
            fromExtent(
                boundingExtent([
                    this.map.olMap.getCoordinateFromPixel([pixel[0] - pixelRadius, pixel[1] - pixelRadius]),
                    this.map.olMap.getCoordinateFromPixel([pixel[0] + pixelRadius, pixel[1] + pixelRadius]),
                ])
            )
        )
    };

    async renderPopup(e) {
        if (e.type === "contextmenu") {
            const lonlat = transform(e.coordinate, this.display.displayProjection, this.display.lonlatProjection);
            this.setPointContextClick({
                typeEvents: "contextmenu",
                pixel: e.pixel,
                clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                coordinate: e.coordinate,
                lonlat: lonlat,
            });

            await getPositionContext(e.originalEvent.clientX, e.originalEvent.clientY, this)
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
                    const data = item.data.sort((r, l) => orderObj[l.styleId] - orderObj[r.styleId]);
                    this.setResponse({ data: data, featureCount: item.featureCount });
                    if (this.mode === "click") {
                        this.setSelected(data[0]);
                    } else if (this.mode === "simulate" || this.mode === "selected") {
                        const val = { ...data.find(x => x.value === this.params.request.p.value.selected) } as DataProps;
                        this.setSelected(val);
                    }

                    const pxy = this.mode === "simulate" || this.mode === "selected" ? e.pixel : [e.originalEvent.clientX, e.originalEvent.clientY];
                    const lonlat = transform(e.coordinate, this.display.displayProjection, this.display.lonlatProjection);
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
                    this.contentGenerate();
                    this.renderPoint(e);
                    const propsPopup = { display: this.display, store: this };
                    this.rootPopup.render(<Popup {...propsPopup} />);
                    this.setContextHidden(true);
                    this.setPopupHidden(false);
                });
        }
    }

    overlayInfo(e: MapBrowserEvent, props) {
        const opts = this.display.config.options;
        const attr = opts["webmap.identification_attributes"];
        this.setMode(props.type);

        if (e.type === "click") {
            const styles: StylesRequest[] = [];
            const mapResolution = this.map.olMap.getView().getResolution();
            const visibleLayers = this.display.treeStore.visibleLayers;
            visibleLayers.forEach(item => {
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

            this.renderPopup(e);
        }
        else if (e.type === "contextmenu") {
            this.renderPopup(e)
        }
        else if (e.type === "simulate" || e.type === "selected") {
            const items = this.display.treeStore.visibleLayers;
            props.p.value.params.map(itm => {
                items.some(x => {
                    if (x.id.styleId === itm.id) {
                        const label = items.find(p => p.id.styleId === itm.id).label;
                        const dop = items.find(p => p.id.styleId === itm.id).position;
                        itm.label = label;
                        itm.dop = dop;
                    }
                });
            });

            this.setParams({
                point: e.coordinate,
                request: {
                    srs: this.displaySrid,
                    geom: this.requestGeomString(this.map.olMap.getPixelFromCoordinate(props.p.coordinate)),
                    styles: props.p.value.params,
                    point: props.p.coordinate,
                    status: attr,
                    p: props.p,
                },
            });
            this.renderPopup(e);
        }
    };

    async LinkToGeometry(value: DataProps) {
        const styles: number[] = [];
        const items = await this.display.getVisibleItems();
        const zoom = this.display.map.olMap.getView().getZoom();
        items.map(i => {
            styles.push(i.styleId);
        });

        const paramsUrl = new URLSearchParams();
        const obj = { request: "feature", lid: value.layerId, styleId: value.styleId, styles: styles };

        if (value.type === "vector") {
            Object.assign(obj, { vector: value.value, fid: value.id, type: "vector" })
        } else if (value.type === "raster") {
            Object.assign(obj, { raster: value.value, type: "raster", zoom: zoom })
        }

        getEntries(obj)?.map(([key, value]) => {
            paramsUrl.append(key, value);
        })
        const link = paramsUrl.toString();
        this.setLinkToGeometry(decodeURIComponent(link))
    }

    async updatePermalink() {
        const display = this.display;
        const visibleItems = this.display.treeStore.visibleLayers;
        const permalink = getPermalink({ display, visibleItems });
        this.setPermalink(decodeURIComponent(permalink + "&panel=" + String(this.activePanel)));
    }

    updateSelectFeatures(panel, data, res) {
        const obj = { ...panel.selectedFeatures };
        const [key] = getEntries(obj).filter(([_, val]) => val.styleId === data.styleId)[0];
        Object.assign(data, { feature: res });
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
        const visibleLayers = this.display.treeStore.visibleLayers;
        visibleLayers.forEach(item => {
            if (item.visibility === true) {
                styles.push(item.styleId);
            }
        });

        const result = [...new Set(this.response.data.map(a => ({ styleId: a.styleId, desc: a.desc })))].sort();
        const params: ParamsProps[] = [];
        result.map(i => {
            params.push({
                id: Number(i.styleId),
                label: i.desc,
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
            this.getContent(selectVal, false)
                .then((res) => {
                    this.LinkToGeometry(selectVal);
                    this.setValueRnd({ ...this.valueRnd, buttonZoom: { [Object.keys(this.valueRnd?.buttonZoom)[0]]: true } });

                    const pm = this.display.panelManager;
                    const pkey = "selected-feature";
                    const panel = pm.getPanel<SelectedFeatureStore>(pkey);

                    if (panel) {
                        this.updateSelectFeatures(panel, this.propsCoords, res);
                    }
                })
        } else {
            this.generateUrl({ res: null, st: null, pn: null, disable: false });
            this.setSelected({});
            this.setLinkToGeometry("");
            this.display.highlighter.unhighlight();
            this.setValueRnd({ ...this.valueRnd, buttonZoom: { [Object.keys(this.valueRnd?.buttonZoom)[0]]: false } });
        }
    }

    async getResponse() {
        const pm = this.display.panelManager;
        const pkey = "selected-feature";
        const panel = pm.getPanel<SelectedFeatureStore>(pkey);
        if (["click", "simulate"].includes(this.mode)) {
            const feature = await route("feature_layer.imodule")
                .post({
                    body: JSON.stringify(this.params.request),
                })
            return new Promise<Response>(resolve => resolve(feature));
        } else if (this.mode === "selected") {
            return new Promise<Response>(resolve => resolve({ data: [panel.activeChecked.acvalue.selected], featureCount: 1 }));
        } else {
            return new Promise<Response>(resolve => resolve({ data: [], featureCount: 0 }));
        }
    }

    async getAttribute(res: DataProps) {
        const opts = this.display.config.options;
        const attrs = opts["webmap.identification_attributes"];
        const resourceId = res.permission !== "Forbidden" ? res.layerId : -1;

        const highlights = this.display.treeStore.filter({
            type: "layer",
            layerId: res.layerId,
        }).find(itm => itm.styleId === res.styleId).layerHighligh;

        const geom = highlights === true ? true : false;
        const query = { geom: geom, dt_format: "iso" };

        if (attrs === false) {
            Object.assign(query, { fields: attrs })
        }

        const feature = res.permission !== "Forbidden" ?
            await route("feature_layer.feature.item", {
                id: resourceId,
                fid: res.id,
            })
                .get({
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
            this.setActiveFeatureData({ dataSource, feature, resourceId })
            return { dataSource, feature, resourceId };
        } else {
            return { updateName: undefined, feature: feature, resourceId: -1 };
        }
    }

    async generateUrl({ res, st, pn, disable }) {
        if (this.pointPopupClick) {
            const [lon, lat] = this.pointPopupClick.lonlat.map(number => parseFloat(number.toFixed(12)));
            const webmapId = this.display.config.webmapId;
            const zoom = this.map.olMap.getView().getZoom();

            const styles: string[] = [];
            const visibleLayers = this.display.treeStore.visibleLayers;
            visibleLayers.forEach(item => {
                if (item.visibility === true) {
                    styles.push(item.styleId);
                }
            });

            const selected = res?.type === "raster" ? [res?.styleId + ":" + res?.layerId + ":" + lon + ":" + lat] : [res?.styleId + ":" + res?.layerId + ":" + res?.id];
            const result = [...new Set(st?.map(a => a.styleId))].sort();

            const panel = this.display.panelManager.getActivePanelName() === undefined ? "none" : this.display.panelManager.getActivePanelName();

            let obj;
            if (disable) {
                obj = { attribute: false, lon, lat, zoom, styles: styles, st: result, slf: selected, pn: pn, base: this.display.map.baseLayer?.name };
            } else {
                if (res) {
                    obj = { attribute: true, lon, lat, zoom, styles: styles, st: result, slf: selected, pn: pn, base: this.display.map.baseLayer?.name };
                } else {
                    obj = { attribute: false, lon, lat, zoom, styles: styles, base: this.display.map.baseLayer?.name };
                }
            }

            if (panel !== "share") {
                Object.assign(obj, { panel: panel });
            }

            const paramsUrl = new URLSearchParams();

            Object.entries(obj)?.map(([key, value]) => {
                paramsUrl.append(key, value);
            })

            const url = routeURL("webmap.display", webmapId);
            const link = origin + url + "?" + paramsUrl.toString();

            this.setContextUrl(decodeURIComponent(link));
        }
    };

    async getContent(val: DataProps, key: boolean) {
        if (val.type === "vector") {
            const pm = this.display.panelManager;
            const pkey = "selected-feature";
            const panel = pm.getPanel<SelectedFeatureStore>(pkey);
            const res = this.mode === "selected" ?
                panel.activeChecked.acvalue.feature :
                await this.getAttribute(val);

            this.setExtensions(res.feature.extensions);

            res?.dataSource?.then(i => {
                this.setAttribute(i);
            });

            const highlights = this.display.treeStore.filter({
                type: "layer",
                layerId: val.layerId,
            }).find(itm => itm.styleId === val.styleId).layerHighligh;

            if (highlights === true) {
                this.display.highlighter.highlight({
                    geom: res.feature.geom,
                    featureId: res.feature.id,
                    layerId: res.resourceId,
                    colorSF: this.display.config.colorSF,
                });
            } else {
                this.display.highlighter.unhighlight();
            }

            this.generateUrl({ res: val, st: this.response.data, pn: this.fixPanel, disable: false });

            if (key === true) {
                this.setUpdate(false);
            }
            return res
        }
        else if (val.type === "raster") {
            this.setAttribute(val.attr);
            this.generateUrl({ res: val, st: this.response.data, pn: this.fixPanel, disable: false });
            this.display.highlighter.unhighlight();
            if (key === true) {
                this.setUpdate(false);
            }
        }
    }

    pModuleUrlParams({ lon, lat, attribute, st, slf, pn }: UrlParamsProps) {
        const slf_ = new String(slf);
        if (attribute && attribute === "false") {
            this.responseContext({ lon, lat, attribute: false });
        } else if (slf_ instanceof String) {
            this.responseContext({ lon, lat, attribute: true, st, slf, pn })
        }
    };

    responseContext(val: UrlParamsProps) {
        const olMap = this.display.map.olMap
        const transformedCoord = transform([Number(val.lon), Number(val.lat)], this.display.lonlatProjection, this.display.displayProjection);

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

        olMap.once("loadend", () => {
            const panelSize = this.activePanel === "none" || this.activePanel === undefined ? 0 : 350;
            const pixel = olMap.getPixelFromCoordinate(p.coordinate);
            const simulateEvent: any = {
                coordinate: p && p.coordinate,
                map: olMap,
                target: "map",
                pixel: [
                    pixel[0] + panelSize + this.offHP, pixel[1] + this.offHP
                ],
                type: "simulate"
            };
            this.overlayInfo(simulateEvent, { type: "simulate", p: p });
        });
    };

    zoomTo(val) {
        if (!val) return;
        this.display.highlighter
            .highlightById(val.id, val.layerId, this.display.config.colorSF)
            .then((feature) => {
                this.display.map.zoomToGeom(feature.geom);
            });
    };

    zoomToExtent(extent: number[], {
        ...fitOpts
    }): void {
        this.display.map.zoomToExtent(extent, {
            displayProjection: this.display.displayProjection,
            ...fitOpts
        });
    };

    async zoomToLayerExtent(val) {
        const { extent } = await route("layer.extent", {
            id: val?.styleId,
        }).get({ cache: true });

        this.display.map.zoomToNgwExtent(extent, {
            displayProjection: this.display.displayProjection,
        });
        topic.publish("update.point", false);
    };

    zoomToPoint(coordinates: number[], fitOpts?: FitOptions): void {
        const view = this.map.olMap.getView();
        if (!coordinates) return;
        const point = new OlGeomPoint(coordinates);
        view.fit(point.getExtent(), fitOpts);
    };

    isEditEnabled(display: Display, item) {
        const pluginName = "@nextgisweb/webmap/plugin/feature-layer";

        if (display.isTinyMode && !display.isTinyModePlugin(pluginName)) {
            return false;
        }
        const configLayerPlugin = item?.plugin["@nextgisweb/webmap/plugin/feature-layer"];
        const readOnly = configLayerPlugin?.readonly;
        return !readOnly;
    };

    checkPointExtent(p?: number[], e?: number[]) {
        const point = p ? p : this.pointPopupClick.coordinate
        const ext = e ? e : this.display.map.olMap.getView().calculateExtent();
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