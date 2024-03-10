import type { DojoDisplay } from "../type";
import { useCallback, useEffect, useState } from "react";
import Feature from "ol/Feature";


export const useFeatures = (display: DojoDisplay) => {

    const map = display.map.olMap;

    const zoomfeature = useCallback((item) => {
        const geometry = item?.getGeometry();
        display.map.zoomToFeature(
            new Feature({ geometry })
        );
    })

    const displayFeatureInfo = useCallback(
        (pixel: number[]): number[] => {
            const features = [];
            map.forEachFeatureAtPixel(pixel, (e) => {
                features.push(e);
            },
                { hitTolerance: 10 },
                {
                    layerFilter: (layer) => {
                        return layer.get('name') !== 'drawing-layer';
                    }
                }
            );

            return features;
        }
    );

    const visibleLayer = useCallback((e, item) => {
        map.getLayers().getArray().forEach(layer => {
            if (layer.get('name') === item.uid) {
                e.target.checked ? layer.setVisible(true) : layer.setVisible(false);
            }
        });
    });


    return { visibleLayer, displayFeatureInfo, zoomfeature };
};
