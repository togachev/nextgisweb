import type { Map } from "ol";

import { useEffect } from "react";

import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";

import { Draw, Snap } from "ol/interaction";

import { Circle as CircleStyle, Fill, Stroke, Style } from 'ol/style';

import "./DrawFeature.less";

import type { DojoTopic } from "./type";

interface DrawFeatureProps {
    map: Map;
    show: boolean;
    topic: DojoTopic;
}

const style = new Style({
    fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
    }),
    stroke: new Stroke({
        color: '#33cc33',
        width: 2,
    }),
    image: new CircleStyle({
        radius: 7,
        fill: new Fill({
            color: '#ffcc33',
        }),
    }),
});

type interactionType = {
    array: any[];
};

const interactions: interactionType = {
    array: [],
}

export function DrawFeature({ map, show, topic }: DrawFeatureProps) {
    const source = new VectorSource({ wrapX: false });
    const vector = new VectorLayer({
        source: source,
    });
    vector.set('name', 'drawing-layer')
    map.addLayer(vector);

    useEffect(() => {
        if (show) {
            const draw = new Draw({
                source: source,
                type: 'LineString',
                style: style,
                stopClick: true
            });
            map.addInteraction(draw);

            map.getLayers().forEach((layer) => {
                if (layer instanceof VectorLayer) {

                    const snap = new Snap({
                        source: layer.getSource()
                    });
                    interactions.array.push(snap);
                }
            });

            interactions.array.map(item => {
                map.addInteraction(item);
            })

            draw.setActive(true);
            topic.publish("webmap/tool/identify/off");

        } else {
            topic.publish("webmap/tool/identify/on");
            map.getInteractions().forEach((interaction) => {
                if (interaction instanceof Draw) {
                    map.removeInteraction(interaction);
                }
            });
        }
    }, [show, map]);
}
