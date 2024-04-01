import type { Feature as OlFeature, FeatureLike } from "ol/Feature";
import Feature from "ol/Feature";
import { Vector as VectorSource } from "ol/source";
import type { Vector as OlVectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import type { Vector as OlVectorLayer } from "ol/layer";
import { Circle, Fill, Stroke, Style } from "ol/style";

import type { DojoDisplay } from "../../type";

interface InfoUpload {
    uid: string;
    name: string;
}

type SourceType = {
    id: number;
    url: string;
    format: string;
    file: InfoUpload;
    length: number;
};

const uploadStyle = new Style({
    stroke: new Stroke({
        width: 3,
        color: "#009DFF",
    }),
    image: new Circle({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        stroke: new Stroke({
            width: 2,
            color: "#fff",
        }),
        radius: 5,
        fill: new Stroke({
            width: 2,
            color: "#106a90",
        }),
    }),
    fill: new Fill({
        color: "#106a9020",
    }),
});

const clickStyle = new Style({
    stroke: new Stroke({
        width: 4,
        color: "#FFE900"
    }),
    fill: new Fill({
        color: "rgba(0, 0, 255, 0.5)",
    }),
    image: new Circle({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        stroke: new Stroke({
            width: 1,
            color: "#000000"
        }),
        radius: 6,
        fill: new Stroke({
            width: 1,
            color: "#FFE900"
        }),
    }),
    zIndex: 100,
});

const createStyle = [
    new Style({
        stroke: new Stroke({
            width: 2,
            color: "#FF2128",
        }),
        image: new Circle({
            stroke: new Stroke({
                width: 1,
                color: "#000000",
            }),
            radius: 5,
            fill: new Stroke({
                width: 4,
                color: "#106a9020",
            }),
        }),
        fill: new Fill({
            color: "#106a9020",
        }),
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 1,
                color: "#ffffff",
            }),
            radius: 6,
        }),
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 1,
                color: "#ffffff",
            }),
            radius: 2,
            fill: new Stroke({
                width: 2,
                color: "#fff",
            }),
        }),
    }),
    new Style({
        image: new Circle({
            radius: 1,
            fill: new Stroke({
                width: 2,
                color: "#000",
            }),
        }),
    }),
];

export const useLayers = (display: DojoDisplay) => {
    const olmap = display.map.olMap;

    const addLayerMap = ({ id, url, format, file, length }: SourceType, geomType: string, typeLayer: string) => {
        const contextLayer = typeLayer === "upload" ? { url: url, format: format } : undefined;
        const zIndex = typeLayer === "upload" ? 100 + id : 1000 + id
        const styleLayer = typeLayer === "upload" ? uploadStyle : createStyle
        const layerName = typeLayer === "upload" ? file.uid + "__upload-layer" : "drawing-layer"

        const customSource = new VectorSource(contextLayer)
        const customVector = new VectorLayer({
            source: customSource,
            zIndex: zIndex,
        })
        customVector.setStyle(styleLayer);
        customVector.set("name", layerName);
        olmap.addLayer(customVector);
        length <= 1 &&
            customSource.once("change", function () {
                if (customSource.getState() === "ready") {
                    olmap.getView().fit(customSource.getExtent(), olmap.getSize());
                }
            });
        return customVector;
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
                    return layer.get("name") !== "drawing-layer";
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
                        e.setStyle(uploadStyle)
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
