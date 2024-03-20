import { useCallback, useState } from "react";
import type { DojoDisplay } from "../../../type";
import { Draw, Modify, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { noModifierKeys, primaryAction } from 'ol/events/condition';

import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

const style = new Style({
    fill: new Fill({
        color: '#B6B1B150',
    }),
    stroke: new Stroke({
        color: '#33cc33',
        width: 2,
    }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({
            color: '#B6B1B150',
        }),
        stroke: new Stroke({
            width: 1,
            color: "rgba(0,0,0,0.8)"
        }),
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

    const addLayerMap = useCallback(() => {
        const source = new VectorSource({ wrapX: false });
        const vector = new VectorLayer({
            source: source,
        });
        vector.setStyle(style);
        vector.set('name', 'drawing-layer');
        olmap.addLayer(vector);
        return vector;
    })

    const getLayer = useCallback((key: number) => {
        const layers = [...olmap.getLayers().getArray()];
        const layer = layers.find(layer => layer.ol_uid === key);
        return layer;
    })

    const drawInteraction = useCallback((item: ItemType) => {
        const layer = getLayer(item.key);
        const source = layer.getSource()
        const modify = new Modify({ source: source });
        const snap = new Snap({ source: source })
        const draw = new Draw({
            source: source,
            type: item.geomType,
            style: style,
            stopClick: true,
            condition: (e) => noModifierKeys(e) && primaryAction(e),
        });

        olmap.addInteraction(draw);
        olmap.addInteraction(snap);
        olmap.addInteraction(modify);

        draw.on('drawend', () => {
            setFeatureCount([...featureCount, item.key])
        });
    })

    const drawInteractionClear = useCallback(() => {
        olmap.getInteractions().forEach((interaction) => {
            if (interaction instanceof Modify) {
                olmap.removeInteraction(interaction);
            }
            if (interaction instanceof Snap) {
                olmap.removeInteraction(interaction);
            }
            if (interaction instanceof Draw) {
                olmap.removeInteraction(interaction);
            }
        });
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

    return { addLayerMap, drawInteractionClear, drawInteraction, featureCount, removeItem, visibleLayer, zoomToLayer };
};
