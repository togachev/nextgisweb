import { useCallback, useState } from 'react';

import { route } from "@nextgisweb/pyramid/api";
import { WKT } from "ol/format";
import { Point } from "ol/geom";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/"
import MapBrowserEvent from 'ol/MapBrowserEvent';

const srsCoordinates = {};
if (spatialRefSysList) {
    spatialRefSysList.forEach((srsInfo) => {
        srsCoordinates[srsInfo.id] = srsInfo;
    });
}

export const useGeom = (tool) => {

    const toWGS84 = async (event: MapBrowserEvent, value: number) => {
        const wkt = new WKT();
        const point = event.coordinate;

        const coords = await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: value,
                    srs_to: Object.keys(srsCoordinates).map(Number),
                    geom: wkt.writeGeometry(new Point(point)),
                },
            })
            .then((transformed) => {
                const t = transformed.find(i => i.srs_id !== value)
                const wktPoint = wkt.readGeometry(t.geom);
                const transformedCoord = wktPoint.getCoordinates();
                return transformedCoord;
            });
        return coords;
    };

    const displayFeatureInfo = async (pixel: number[]) => {
        const point = tool.olmap.getCoordinateFromPixel(pixel);
        const request: RequestProps = {
            srs: 3857,
            geom: tool._requestGeomString(pixel),
            styles: [],
        };
        const layerLabels = {};
        tool.display.getVisibleItems()
            .then(items => {
                const itemConfig = tool.display.getItemConfig();
                const mapResolution = tool.olmap.getView().getResolution();
                items.map(i => {
                    const item = itemConfig[i.id];
                    if (
                        !item.identifiable ||
                        mapResolution >= item.maxResolution ||
                        mapResolution < item.minResolution
                    ) {
                        return;
                    }
                    layerLabels[item.layerId] = item.label
                    request.styles.push(item.styleId);
                });
            })

        await route("feature_layer.identify")
            .post({
                json: request,
            })
            .then((response) => {
                console.log(response, point, layerLabels);
            })

    };

    return { displayFeatureInfo, toWGS84 };
};


