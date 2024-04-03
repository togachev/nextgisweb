import type { Feature as OlFeature, FeatureLike } from "ol/Feature";
import Feature from "ol/Feature";
import { Vector as VectorSource } from "ol/source";
import type { Vector as OlVectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import type { Vector as OlVectorLayer } from "ol/layer";
import { customStyle, clickStyle } from "../constant";

import type { DojoDisplay } from "../../type";
import type { SourceType } from "../type";

export const useFeatures = (display: DojoDisplay) => {
    const olmap = display.map.olMap;
    const addLayerMap = ({ id, url, format, file, length }: SourceType) => {
        const customSource = new VectorSource({ url: url, format: format })
        const customLayer = new VectorLayer({
            source: customSource,
            zIndex: 100 + id,
        })
        customLayer.setStyle(customStyle);
        customLayer.set("name", file.uid + "__upload-layer");
        olmap.addLayer(customLayer);
        length <= 1 &&
            customSource.once("change", function () {
                if (customSource.getState() === "ready") {
                    olmap.getView().fit(customSource.getExtent(), olmap.getSize());
                }
            });
    }

    const zoomfeature = (item: OlFeature) => {
        const geometry = item?.getGeometry();
        display.map.zoomToFeature(
            new Feature({ geometry })
        );
    }

    const zoomToLayer = (value: string) => {
        olmap.getLayers().forEach((layer: OlVectorLayer<OlVectorSource>) => {
            const uid = layer?.get("name")?.split("__")[0]
            if (value === uid) {
                const extent = layer.getSource().getExtent();
                olmap.getView().fit(extent, olmap.getSize());
            }
        })
    }

    const displayFeatureInfo = (pixel: number[]): number[] => {
        const features: FeatureLike[] = []
        olmap.forEachFeatureAtPixel(pixel, (feature: Feature) => {
            feature.setStyle(clickStyle);
            features.push(feature);
        },
            {
                hitTolerance: display.clientSettings.identify_radius,
                layerFilter: (layer: OlVectorLayer<OlVectorSource>) => {
                    const pref = layer.get("name")?.split("__")[1]
                    if (pref === "upload-layer") {
                        return layer;
                    }
                }
            },
        );
        return features;
    };

    const visibleLayer = (checked: boolean, value: string) => {
        olmap.getLayers().getArray().forEach((layer: OlVectorLayer<OlVectorSource>) => {
            const uid = layer.get("name")?.split("__")[0]
            const pref = layer.get("name")?.split("__")[1]
            if (pref === "upload-layer" && uid === value) {
                checked ? layer.setVisible(true) : layer.setVisible(false);
            }
        });
    };

    const setCustomStyle = (value: OlVectorLayer<OlVectorSource>, status: boolean) => {
        if (status) {
            setCustomStyle(null, false)
            value.setStyle(clickStyle);
        } else {
            olmap.getLayers().forEach((layer: OlVectorLayer<OlVectorSource>) => {
                const pref = layer.get("name")?.split("__")[1]
                if (pref === "upload-layer") {
                    layer.getSource().forEachFeature((e) => {
                        e.setStyle(customStyle)
                    })
                }
            })
        }
    }

    const removeItem = (value: string) => {
        olmap.getLayers().forEach((layer: OlVectorLayer<OlVectorSource>) => {
            const uid = layer?.get("name")?.split("__")[0]
            if (value === uid) {
                olmap.removeLayer(layer);
            }
        });
        olmap.getView().fit(display._extent, olmap.getSize());
    }

    const removeItems = () => {
        const layers = [...olmap.getLayers().getArray()];
        layers.forEach(layer => {
            const pref = layer.get("name")?.split("__")[1]
            if (pref === "upload-layer") {
                olmap.removeLayer(layer);
            }
        });
        olmap.getView().fit(display._extent, olmap.getSize());
    };

    return { displayFeatureInfo, olmap, removeItem, removeItems, setCustomStyle, visibleLayer, zoomfeature, zoomToLayer, addLayerMap };
};
