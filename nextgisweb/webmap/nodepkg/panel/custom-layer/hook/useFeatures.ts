import Feature from "ol/Feature";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";

import GPX from "ol/format/GPX";
import KML from "ol/format/KML";
import GeoJSON from "ol/format/GeoJSON";

import { Circle, Fill, Stroke, Style } from "ol/style";

import type { DojoDisplay } from "../../type";

interface FileUpload {
    uid: string;
}

interface InfoUpload {
    file: FileUpload;
    fileList: FileUpload[];
}

type SourceType = {
    url: string;
    format: string;
    info: InfoUpload;
};

const customStyle = new Style({
    stroke: new Stroke({
        width: 1.66,
        color: "#FF8B00"
    }),
    image: new Circle({
        anchor: [0.5, 46],
        anchorXUnits: "fraction",
        anchorYUnits: "pixels",
        stroke: new Stroke({
            width: 1,
            color: "rgba(0,0,0,0.8)"
        }),
        radius: 4,
        fill: new Stroke({
            width: 1,
            color: "rgba(16,106,144,0.5)"
        }),
    }),
    fill: new Fill({
        color: "rgba(0, 0, 255, 0.5)",
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

const typeFile = [
    { type: 'application/gpx+xml', format: new GPX() },
    { type: 'application/geo+json', format: new GeoJSON() },
    { type: 'application/vnd.google-earth.kml+xml', format: new KML() },
];

export const useFeatures = (display: DojoDisplay) => {
    const olmap = display.map.olMap;
    const addLayerMap = ({ url, format, info }: SourceType) => {
        const customSource = new VectorSource({ url: url, format: format })
        const customLayer = new VectorLayer({
            source: customSource,
        })
        customLayer.setStyle(customStyle);
        customLayer.set("name", info.file.uid + "__upload-layer");
        olmap.addLayer(customLayer);
        info.fileList.length <= 1 &&
            customSource.once("change", function () {
                if (customSource.getState() === "ready") {
                    olmap.getView().fit(customSource.getExtent(), olmap.getSize());
                }
            });
    }

    const zoomfeature = (item) => {
        const geometry = item?.getGeometry();
        display.map.zoomToFeature(
            new Feature({ geometry })
        );
    }

    const zoomToLayer = (value) => {
        olmap.getLayers().forEach((layer) => {
            const uid = layer?.get("name")?.split("__")[0]
            if (value === uid) {
                const extent = layer.getSource().getExtent();
                olmap.getView().fit(extent, olmap.getSize());
            }
        })
    }

    const displayFeatureInfo = (pixel: number[]): number[] => {
        const features = [];
        olmap.forEachFeatureAtPixel(pixel, (e) => {
            e.setStyle(clickStyle);
            features.push(e);
        },
            { hitTolerance: 10 },
            {
                layerFilter: (layer) => {
                    return layer.get("name") !== "drawing-layer";
                }
            }
        );
        return features;
    };

    const visibleLayer = (e, value) => {
        olmap.getLayers().getArray().forEach(layer => {
            const uid = layer.get("name")?.split("__")[0]
            const pref = layer.get("name")?.split("__")[1]
            if (pref === "upload-layer" && uid === value) {
                e.target.checked ? layer.setVisible(true) : layer.setVisible(false);
            }
        });
    };

    const setCustomStyle = (value, status) => {
        if (status) {
            setCustomStyle(null, false)
            value.setStyle(clickStyle);
        } else {
            olmap.getLayers().forEach(layer => {
                const pref = layer.get("name")?.split("__")[1]
                if (pref === "upload-layer" || layer.get("name") === "drawing-layer") {
                    layer.getSource().forEachFeature((e) => {
                        e.setStyle(customStyle)
                    })
                }
            })
        }
    }

    const removeItem = (value) => {
        olmap.getLayers().forEach((layer) => {
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
            if (
                pref === "upload-layer"
                // || layer.get("name") === "drawing-layer"
            ) {
                olmap.removeLayer(layer);
            }
        });
        olmap.getView().fit(display._extent, olmap.getSize());
    };

    return { displayFeatureInfo, olmap, removeItem, removeItems, setCustomStyle, typeFile, visibleLayer, zoomfeature, zoomToLayer, addLayerMap };
};
