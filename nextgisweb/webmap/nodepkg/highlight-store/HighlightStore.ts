import { action, observable } from "mobx";
import type { Geometry } from "ol/geom";

import { route } from "@nextgisweb/pyramid/api";

interface ColorSF {
    stroke_primary: string;
    stroke_secondary: string;
    fill: string;
}

export interface HighlightEvent {
    geom?: string;
    layerId?: number;
    featureId?: number | string;
    olGeometry?: Geometry;
    coordinates?: [number, number];
    colorSF: ColorSF;
}

export class HighlightStore {
    @observable.ref accessor highlighted: HighlightEvent[] = [];
    @observable.ref accessor colorSF: ColorSF | null = null;

    @action
    setColorSF(colorSF: ColorSF) {
        this.colorSF = colorSF;
    }


    @action.bound
    highlight(e: HighlightEvent | HighlightEvent[]) {
        const arr = Array.isArray(e) ? e : [e];
        this.highlighted = arr;
        const color = arr[0].colorSF;
        this.setColorSF(color);
    }

    @action.bound
    unhighlight(filter?: (e: HighlightEvent) => boolean) {
        if (!filter) {
            this.highlighted = [];
            return;
        }
        this.highlighted = this.highlighted.filter((x) => !filter(x));
    }

    @action.bound
    async highlightById(featureId: number, layerId: number, colorSF?: ColorSF) {
        const feature = await route("feature_layer.feature.item", {
            id: layerId,
            fid: featureId,
        }).get({
            query: { dt_format: "iso", fields: [], extensions: [] },
            cache: true,
        });

        const event = {
            geom: feature.geom,
            featureId,
            layerId,
            colorSF,
        };
        this.highlight(event);
        return event;
    }
}
