import { useCallback, useState } from "react";
import type { DojoDisplay } from "../../../type";
import { Draw, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
import type { Vector as OlVectorLayer } from "ol/layer";
import { Vector as VectorLayer } from "ol/layer";
import { noModifierKeys, primaryAction } from 'ol/events/condition';
import PolyIcon from "@nextgisweb/icon/material/hexagon/outline";
import LineIcon from "@nextgisweb/icon/material/show_chart/outline";
import CircleIcon from "@nextgisweb/icon/material/scatter_plot/outline";

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

export const useDraw = (display: DojoDisplay) => {
    const olmap = display.map.olMap;
    const [featureCount, setFeatureCount] = useState([]);
    const [layerKeyDraw, setLayerKeyDraw] = useState();

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


    const drawInteraction = useCallback((item) => {
        const draw = new Draw({
            source: item.layer?.getSource(),
            type: item.geomType,
            style: style,
            stopClick: true,
            condition: (e) => noModifierKeys(e) && primaryAction(e),
        });
        olmap.addInteraction(draw);
        setLayerKeyDraw(item.key)
        item.change = true
        draw.on('drawend', (e) => {
            setFeatureCount([...featureCount, item.key])
        });
    })

    const drawInteractionClear = (item) => {
        const interactions = [...olmap.getInteractions().getArray()];
        olmap.getInteractions().forEach((interaction) => {
            if (interaction instanceof Draw) {
                olmap.removeInteraction(interaction);
            }
        });
        setLayerKeyDraw(null)
        item.change = false
    }

    const visibleLayer = (e, layer) => {
        e.target.checked ? layer.setVisible(true) : layer.setVisible(false);
    };

    const zoomToLayer = (layer) => {
        const extent = layer.getSource().getExtent();
        olmap.getView().fit(extent, olmap.getSize());
    }

    const removeItem = (layer) => {
        olmap.removeLayer(layer);
        olmap.getView().fit(display._extent, olmap.getSize());
    }

    return { addLayerMap, drawInteractionClear, drawInteraction, featureCount, layerKeyDraw, olmap, removeItem, visibleLayer, zoomToLayer };
};
