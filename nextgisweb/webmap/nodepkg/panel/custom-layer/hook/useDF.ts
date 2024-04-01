import type { Feature as OlFeature, FeatureLike } from "ol/Feature";
import Feature from "ol/Feature";
import { Vector as VectorSource } from "ol/source";
import type { Vector as OlVectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import type { Vector as OlVectorLayer } from "ol/layer";
import { Circle, Fill, Stroke, Style } from "ol/style";
import { useCallback, useEffect, useState } from "react";
import type { DojoDisplay } from "../../../type";
import { Draw, Modify, Snap } from "ol/interaction";
import { primaryAction, shiftKeyOnly } from "ol/events/condition";
import { TYPE_FILE } from "../constant";




type InfoUpload = {
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

type ItemType = {
    key: number;
    change: boolean;
    label: string;
    geomType: string;
    allLayer: boolean;
    edge: boolean;
    vertex: boolean;
    draw: boolean;
    modify: boolean;
};

type ParamsFormat = {
    value: string;
    label: string;
    disabled: boolean;
};

const style = [
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

const styleDraw = [
    new Style({
        stroke: new Stroke({
            width: 2,
            color: "#FF0000",
            lineDash: [5, 5]
        }),
        zIndex: 1000
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 2,
                color: "#1400FF",
            }),
            radius: 6,
        }),
    }),
    new Style({
        image: new Circle({
            stroke: new Stroke({
                width: 2,
                color: "#1400FF",
            }),
            radius: 2,
            fill: new Stroke({
                width: 2,
                color: "#fff",
            }),
        }),
    }),
];

const customStyle = new Style({
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

export const useFeatures = (display: DojoDisplay) => {
    const olmap = display.map.olMap;

    const [featureCount, setFeatureCount] = useState([]);
    const [draw, setDraw] = useState();
    const [snap, setSnap] = useState([]);
    const [modify, setModify] = useState();
    const [propSnap, setPropSnap] = useState();

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

    const addLayerMap = useCallback((id) => {
        const source = new VectorSource({ wrapX: false });
        const vector = new VectorLayer({
            source: source,
            zIndex: 1000 + id,
        });
        vector.setStyle(style);
        vector.set("name", "drawing-layer");
        olmap.addLayer(vector);
        return vector;
    })

        const getLayer = useCallback((key: number) => {
        const layers = [...olmap.getLayers().getArray()];
        const layer = layers.find(layer => layer.ol_uid === key && layer.get("name") === "drawing-layer");
        return layer;
    })

    const snapBuild = useCallback((params) => {
        setPropSnap(params)
    })

    const snapInteraction = useCallback((params, status) => {
        if (!status) {
            const layer = getLayer(params.key);
            const snap_ = new Snap({
                source: layer.getSource(),
                edge: params.edge,
                vertex: params.vertex,
            });
            olmap.addInteraction(snap_)
            setSnap([...snap, { [layer.ol_uid] : snap_}])
        } else {
            olmap.getLayers().forEach(layer => {
                if (layer instanceof VectorLayer) {
                    const snap_ = new Snap({
                        source: layer.getSource(),
                        edge: propSnap.edge,
                        vertex: propSnap.vertex,
                    });
                    setSnap([...snap, { [layer.ol_uid] : snap_}])
                    snap_.setActive(true)
                    olmap.addInteraction(snap_)
                }
            })
        }

    });

    useEffect(() => {
        if (propSnap === undefined) return;
        if (propSnap?.allLayer) {
            snapInteraction(propSnap, true)
        }
        if (!propSnap?.vertex && !propSnap?.edge) {
            snap.map(item => {
                const key_ = Object.keys(item)[0];
                const snap_ = Object.values(item)[0];
                if (key_ === propSnap.key) {
                    snap_.setActive(false)
                    snap_.vertex_ = false
                    snap_.edge_ = false
                }
            })
        } else if (propSnap?.vertex || propSnap?.edge) {
            snap.map(item => {
                const key_ = Object.keys(item)[0];
                const snap_ = Object.values(item)[0];
                if (key_ === propSnap.key) {
                    snap_.setActive(true)
                    snap_.vertex_ = propSnap?.vertex
                    snap_.edge_ = propSnap?.edge
                }
            })
        }
        if (propSnap?.modify) {
            modify.setActive(true);
            draw.setActive(false);
        } else {
            modify.setActive(false);
            draw.setActive(true);
        }
        
    }, [propSnap])

    const modifyInteraction = useCallback((item: ItemType) => {
        const layer = getLayer(item.key);
        const modify_ = new Modify({
            source: layer.getSource(),
            deleteCondition: shiftKeyOnly,
        });
        modify_.setActive(item.modify)
        olmap.addInteraction(modify_);
        setModify(modify_);
    });

    const drawInteraction = useCallback((item: ItemType) => {
        const layer = getLayer(item.key);
        const draw_ = new Draw({
            source: layer.getSource(),
            type: item.geomType,
            style: styleDraw,
            stopClick: true,
            condition: (e) => primaryAction(e),
            snapTolerance: 10,
        });
        draw_.setActive(item.draw)
        olmap.addInteraction(draw_);
        setDraw(draw_);

        draw_.on("drawend", () => {
            setFeatureCount([...featureCount, item.key])
        });
    });

    const interactionClear = useCallback(() => {
        olmap.removeInteraction(draw);
        olmap.removeInteraction(modify);
        snap?.map(item => {
            
            const snap_ = Object.values(item)[0];
            olmap.removeInteraction(snap_);
        });
        setSnap([]);
    })

    const visibleLayer = (checked: boolean, key: number) => {
        const layer = getLayer(key);
        checked ? layer.setVisible(true) : layer.setVisible(false);
    };

    const zoomToLayer = (key: number) => {
        const layer = getLayer(key);
        const extent = layer.getSource().getExtent();
        olmap.getView().fit(extent, olmap.getSize());
    }

    const removeItem = (key: number) => {
        const layer = getLayer(key);
        olmap.removeLayer(layer);
        olmap.getView().fit(display._extent, olmap.getSize());
    }

    const removeItems = () => {
        const layers = [...olmap.getLayers().getArray()];
        layers.forEach(layer => {
            if (layer.get("name") === "drawing-layer") {
                olmap.removeLayer(layer);
            }
        })
        olmap.getView().fit(display._extent, olmap.getSize());
    };

    const features = useCallback((key) => {
        const layer = getLayer(key);
        const features = layer.getSource().getFeatures();
        return features
    });

    const download = (blob, filename) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }

    const saveLayer = (item: ItemType, params: ParamsFormat) => {
        const vf = TYPE_FILE.find(x => x.value === params.value);
        const data = vf?.format.writeFeatures(features(item.key), {
            featureProjection: olmap.getView().getProjection()
        });
        const blob = new Blob([data], { type: vf?.value });
        const date = new Date();
        const formattedDate = `_${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}-${date.getHours()}.${date.getMinutes()}.${date.getMilliseconds()}`;
        const fileName = item.label + "_" + vf?.label + formattedDate + vf?.extension
        download(blob, fileName);
    }

    return { displayFeatureInfo, olmap, removeItem, removeItems, setCustomStyle, visibleLayer, zoomfeature, zoomToLayer, addLayerMapFile };
};
