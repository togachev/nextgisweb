
import type { DojoDisplay } from "../../../type";
import { Draw, Snap } from "ol/interaction";
import { Vector as VectorSource } from "ol/source";
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

    let draw;


    const addLayerMap = () => {
        const source = new VectorSource({ wrapX: false });
        const vector = new VectorLayer({
            source: source,
        });
        vector.setStyle(style);
        vector.set('name', 'drawing-layer');
        olmap.addLayer(vector);
    }


    const drawInteraction = (geomType: string) => {
        draw = new Draw({
            source: source,
            type: geomType,
            style: style,
            stopClick: true,
            condition: (e) => noModifierKeys(e) && primaryAction(e),
        });
        return draw
    }

    const drawInteractionClear = () => {
        const interactions = [...olmap.getInteractions().getArray()];
        interactions.forEach((interaction) => {
            if (interaction instanceof Draw) {
                olmap.removeInteraction(interaction);
            }
        });
    }

    return { addLayerMap, drawInteractionClear, drawInteraction, olmap };
};
