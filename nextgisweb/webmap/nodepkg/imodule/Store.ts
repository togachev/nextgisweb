import { action, observable } from "mobx";
import topic from "@nextgisweb/webmap/compat/topic";
import { getEntries } from "./useSource";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { fieldValuesToDataSource, getFieldsInfo } from "@nextgisweb/webmap/panel/identify/fields";
import type { AttributeProps, DataProps, ExtensionsProps, Rnd, OptionProps } from "./type";
import type { Display } from "@nextgisweb/webmap/display";

export class Store {
    @observable accessor layerName: string | null = null;
    @observable accessor countFeature: number;;
    @observable accessor fixPopup = false;
    @observable accessor hideLegend = true;
    @observable accessor update = false;
    @observable accessor fullscreen = false;

    @observable.ref accessor data: DataProps[] = [];
    @observable.ref accessor selected: DataProps;
    @observable.ref accessor attribute: AttributeProps[] = [];
    @observable.ref accessor extensions: ExtensionsProps | null = null;
    @observable.ref accessor currentUrlParams: string | null = null;
    @observable.ref accessor contextUrl: string | null = null;
    @observable.ref accessor fixContentItem: OptionProps;
    @observable.ref accessor linkToGeometry: string | null = null;
    @observable.ref accessor valueRnd: Rnd;
    @observable.ref accessor fixPos: Rnd | null = null;
    @observable.ref accessor fixPanel: string | null = null;
    @observable.ref accessor display: Display;

    constructor({
        display,
        valueRnd,
        fixPos,
        fixPanel,
    }) {
        this.display = display;
        this.valueRnd = valueRnd;
        this.fixPos = fixPos;
        this.fixPanel = fixPanel;
    }

    @action
    setCountFeature(countFeature: number) {
        this.countFeature = countFeature;
    };

    @action
    setValueRnd(valueRnd: Rnd) {
        this.valueRnd = valueRnd;
    };

    @action
    setHideLegend(hideLegend: boolean) {
        this.hideLegend = hideLegend;
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
    setFixPopup(fixPopup: boolean) {
        this.fixPopup = fixPopup;
    };

    @action
    setLayerName(layerName: string) {
        this.layerName = layerName;
    };

    @action
    setData(data: DataProps[]) {
        this.data = data;
    };

    @action
    setSelected(selected: DataProps) {
        this.selected = selected;
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
    setUpdate(update: boolean) {
        this.update = update;
    };

    @action
    setCurrentUrlParams(currentUrlParams: string) {
        this.currentUrlParams = currentUrlParams;
    };

    @action
    setFullscreen(fullscreen: boolean) {
        this.fullscreen = fullscreen;
    };

    @action
    setContextUrl(contextUrl: string) {
        this.contextUrl = contextUrl;
    };

    @action
    setFixContentItem(fixContentItem: OptionProps) {
        this.fixContentItem = fixContentItem;
    };

    @action
    setLinkToGeometry(linkToGeometry: string) {
        this.linkToGeometry = linkToGeometry;
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

            this.generateUrl({ res: val, st: this.data, pn: this.fixPanel, disable: false });

            if (key === true) {
                this.setUpdate(false);
            }
        }
        else if (val.type === "raster") {
            this.setAttribute(val.attr);
            this.generateUrl({ res: val, st: this.data, pn: this.fixPanel, disable: false });
            topic.publish("feature.unhighlight");
            if (key === true) {
                this.setUpdate(false);
            }
        }
    }

    private async getAttribute(res: DataProps, key) {
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

        const imodule = this.display.imodule;
        const lon = imodule.lonlat[0];
        const lat = imodule.lonlat[1];
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
                const result = [...new Set(st?.map(a => a.styleId))];

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
}