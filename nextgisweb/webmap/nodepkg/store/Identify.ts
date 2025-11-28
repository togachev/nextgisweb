import { action, observable, reaction } from "mobx";
import type { Coordinate } from "ol/coordinate";
import { boundingExtent, getCenter } from "ol/extent";
import { WKT } from "ol/format";
import { fromExtent } from "ol/geom/Polygon";
import { transform } from "ol/proj";

import type Interaction from "ol/interaction/Interaction";

import { route } from "@nextgisweb/pyramid/api/route";
import type { RouteQuery } from "@nextgisweb/pyramid/api/type";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { RasterLayerIdentifyResponse } from "@nextgisweb/raster-layer/type/api";
import webmapSettings from "@nextgisweb/webmap/client-settings";

import type { Display } from "@nextgisweb/webmap/display";
import type { MapStore } from "@nextgisweb/webmap/ol/MapStore";
import type IdentifyStore from "@nextgisweb/webmap/panel/identify/IdentifyStore";
import type {
    FeatureInfo,
    FeatureResponse,
    IdentifyInfo,
    IdentifyResponse,
} from "@nextgisweb/webmap/panel/identify/identification";


interface UrlProps {
    lon: number;
    lat: number;
    st: string;
    slf: string;
}

interface SelectedProps {
    lonlat: number[];
    coordinate: number[];
    visibleStyles: number[];
    styleId: number;
    layerId: number;
    fid: number | string;
}

const wkt = new WKT();

interface IdentifyOptions {
    display: Display;
}

interface Request {
    srs: number;
    geom: string;
    styles: number[];
}

export class Identify {
    label = gettext("Identify");
    iconClass = "iconIdentify";
    pixelRadius: number = webmapSettings.identify_radius || 10;

    map: MapStore;
    display: Display;

    @observable.ref accessor active = true;
    @observable.ref accessor control: Interaction | null = null;
    @observable.ref accessor identifyInfo: IdentifyInfo | null = null;

    constructor(options: IdentifyOptions) {
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

    @action.bound
    clear() {
        this.identifyInfo = null;
        this.display.highlighter.unhighlight();

        const pm = this.display.panelManager;
        const pkey = "identify";
        const panel = pm.getPanel<IdentifyStore>(pkey);
        if (panel) {
            panel.setIdentifyInfo(undefined);
        }
    }

    async highlightFeature(
        identifyInfo: IdentifyInfo,
        featureInfo: FeatureInfo,
        opt: { signal: AbortSignal }
    ) {
        const layerResponse = identifyInfo.response[featureInfo.styleId];

        if ("features" in layerResponse) {
            const featureResponse = layerResponse.features[featureInfo.idx];

            const highlights = featureInfo && this.display.treeStore.filter({
                type: "layer",
                layerId: featureResponse.layerId,
            }).find(itm => itm.styleId === featureResponse.styleId).layerHighligh;

            const custom = {};
            if (highlights === false) {
                Object.assign(custom, { geom: false })
            }

            const featureItem = await route("feature_layer.feature.item", {
                id: featureResponse.layerId,
                fid: featureResponse.id,
            }).get({ query: { dt_format: "iso", ...custom }, ...opt });

            this.display.highlighter.highlight({
                geom: featureItem.geom,
                featureId: featureItem.id,
                layerId: featureInfo.layerId,
                colorSF: this.display.config.colorSF,
            });

            return featureItem;
        }
    }

    async identifyFeatureByValuePopup(val): Promise<boolean> {
        const { lon, lat, st, slf } = val as UrlProps;

        const olMap = this.map.olMap;
        const _slf = slf.split(":").map(i => Number(i));
        const selected: SelectedProps = {
            lonlat: [Number(lon), Number(lat)],
            coordinate: transform([Number(lon), Number(lat)], "EPSG:4326", "EPSG:3857"),
            visibleStyles: st.split(",").map(i => Number(i)),
            styleId: _slf[0],
            layerId: _slf[1],
            fid: _slf[2],
        }

        olMap.once("postrender", (e) => {
            const pixel = e.map.getPixelFromCoordinate(selected.coordinate);
            this.execute(pixel, undefined, selected);
        })

        return true;
    }

    async identifyFeatureByAttrValue(
        layerId: number,
        attrName: string,
        attrValue: string | number,
        zoom?: number
    ): Promise<boolean> {
        const layerInfo = await route("resource.item", {
            id: layerId,
        }).get();

        const query: RouteQuery<"feature_layer.feature.collection", "get"> & {
            [key: `fld_${string}`]: string | number;
        } = {
            limit: 1,
            dt_format: "iso",
        };
        query[`fld_${attrName}__eq`] = attrValue;

        const features = await route("feature_layer.feature.collection", {
            id: layerId,
        }).get({ query });

        if (features.length !== 1) {
            return false;
        }

        const foundFeature = features[0];
        const responseLayerId = layerInfo.resource.id;

        const identifyResponse: FeatureResponse = {
            featureCount: 1,
            [responseLayerId]: {
                featureCount: 1,
                features: [
                    {
                        fields: foundFeature.fields,
                        id: foundFeature.id,
                        label: "",
                        layerId: responseLayerId,
                    },
                ],
            },
        };

        const geometry = wkt.readGeometry(foundFeature.geom);
        const extent = geometry.getExtent();
        const center = getCenter(extent);

        const layerLabels: Record<number, string> = {};
        layerLabels[responseLayerId] = layerInfo.resource.display_name;

        this.openIdentifyPanel({
            features: identifyResponse,
            point: center,
            layerLabels,
        });

        if (zoom) {
            const view = this.map.olMap.getView();
            view.setCenter(center);
            view.setZoom(zoom);
        } else {
            this.map.zoomToExtent(extent);
        }
        return true;
    }

    async execute(pixel: number[], radiusScale?: number, selected?: SelectedProps): Promise<void> {
        const olMap = this.map.olMap;
        const point = olMap.getCoordinateFromPixel(pixel);

        const request: Request = {
            srs: 3857,
            geom: this._requestGeomString(pixel, radiusScale),
            styles: [],
        };

        const items = await this.display.getVisibleItems();
        const mapResolution = this.map.resolution;

        const rasterLayers: number[] = [];

        items.forEach((item) => {
            if (
                mapResolution === null ||
                !(
                    !item.identifiable ||
                    (item.maxResolution !== null &&
                        mapResolution >= item.maxResolution) ||
                    (item.minResolution !== null &&
                        mapResolution < item.minResolution)
                )
            ) {
                if (item.identification) {
                    if (item.identification.mode === "feature_layer") {
                        request.styles.push(item.styleId);
                    } else if (item.identification.mode === "raster_layer") {
                        rasterLayers.push(item.styleId);
                    }
                }
            }
        });

        const layerLabels: Record<number, string | null> = {};
        items.forEach((i) => {
            const styleId = i.styleId;
            layerLabels[styleId] = i.label;
        });

        let features;
        if (request.styles.length) {
            features = await route("feature_layer.identify").post({
                json: request,
            });
        }
        let raster: RasterLayerIdentifyResponse | undefined;
        if (rasterLayers.length) {
            const [x, y] = olMap.getCoordinateFromPixel([pixel[0], pixel[1]]);
            raster = await route("raster_layer.identify").get({
                query: { resources: rasterLayers, x, y },
            });
        }
        
        this.openIdentifyPanel({ features, point, layerLabels, raster, selected });
    }

    private _requestGeomString(pixel: number[], radiusScale = 1): string {
        const olMap = this.map.olMap;
        const radius = this.pixelRadius * radiusScale;
        const bounds = boundingExtent([
            olMap.getCoordinateFromPixel([
                pixel[0] - radius,
                pixel[1] - radius,
            ]),
            olMap.getCoordinateFromPixel([
                pixel[0] + radius,
                pixel[1] + radius,
            ]),
        ]);

        return new WKT().writeGeometry(fromExtent(bounds));
    }

    @action.bound
    private openIdentifyPanel({
        features,
        point,
        layerLabels,
        raster,
        selected,
    }: {
        features?: FeatureResponse;

        point: Coordinate;
        layerLabels: Record<string, string | null>;
        raster?: RasterLayerIdentifyResponse;
        selected?: SelectedProps;
    }): void {
        const response: IdentifyResponse = features || { featureCount: 0 };

        if (response.featureCount === 0) {
            this.identifyInfo = null;
            this.display.highlighter.unhighlight();
        }

        if (raster) {
            for (const item of raster.items) {
                response[item.resource.id] = item;
                response.featureCount += 1;
            }
        }
        
        const identifyInfo: IdentifyInfo = {
            point,
            response,
            layerLabels,
            selected,
        };
        
        this.identifyInfo = identifyInfo;
        
        const pm = this.display.panelManager;
        const pkey = "identify";
        const panel = pm.getPanel<IdentifyStore>(pkey);
        if (panel) {
            panel.setIdentifyInfo(identifyInfo);
        } else {
            throw new Error(
                "Identification panel should add during Display initialization"
            );
        }

        const activePanel = pm.getActivePanelName();
        if (activePanel !== pkey) {
            pm.activatePanel(pkey);
        }
    }
}
