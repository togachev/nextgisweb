import { useCallback, useEffect, useState } from "react";
import type { DojoDisplay } from "../../../type";
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { primaryAction, shiftKeyOnly } from "ol/events/condition";
import { Circle, Fill, Stroke, Style } from "ol/style";

const style = new Style({
    stroke: new Stroke({
        width: 2,
        color: "#FF8B00",
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

type ItemType = {
    key: number;
    change: boolean;
    label: string;
    geomType: string;
};

export const useDraw = (display: DojoDisplay) => {
    const olmap = display.map.olMap;
    const [featureCount, setFeatureCount] = useState([]);

    const [draw, setDraw] = useState();
    const [snap, setSnap] = useState();
    const [snapStatus, setSnapStatus] = useState(false);
    const [modify, setModify] = useState();

    const addLayerMap = useCallback(() => {
        const source = new VectorSource({ wrapX: false });
        const vector = new VectorLayer({
            source: source,
        });
        vector.setStyle(style);
        vector.set("name", "drawing-layer");
        olmap.addLayer(vector);
        return vector;
    })

    const getLayer = useCallback((key: number) => {
        const layers = [...olmap.getLayers().getArray()];
        const layer = layers.find(layer => layer.ol_uid === key);
        return layer;
    })

    useEffect(() => {
        if (snapStatus) {
            olmap.getLayers().forEach(layer => {
                if (layer.get("name") === "drawing-layer") {
                    const snap_ = new Snap({
                        source: layer.getSource(),
                        edge: true,
                        vertex: true,
                    });
                    setSnap(s => ({
                        ...s,
                        [layer.ol_uid]: snap_
                    }))
                    olmap.addInteraction(snap_)
                }
            })
        }
        setSnapStatus(false)
    }, [snapStatus])

    const drawInteraction = useCallback((item: ItemType) => {
        const layer = getLayer(item.key);
        const source = layer.getSource()

        const modify_ = new Modify({
            source: source,
            deleteCondition: shiftKeyOnly,
        });
        olmap.addInteraction(modify_);

        setSnapStatus(true)

        const draw_ = new Draw({
            source: source,
            type: item.geomType,
            style: style,
            stopClick: true,
            condition: (e) => primaryAction(e),
            snapTolerance: 10,
        });
        olmap.addInteraction(draw_);
        setDraw(draw_);
        setModify(modify_);

        draw_.on("drawend", () => {
            setFeatureCount([...featureCount, item.key])
        });

    })

    const drawInteractionClear = useCallback(() => {
        olmap.removeInteraction(draw);
        olmap.removeInteraction(modify);
        Object.entries(snap).forEach(([value]) => {
            olmap.removeInteraction(value);
        });
        setSnap(undefined)
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

    return { addLayerMap, drawInteractionClear, drawInteraction, featureCount, removeItem, removeItems, visibleLayer, zoomToLayer };
};
