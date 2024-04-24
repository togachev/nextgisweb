import { useCallback, useState } from 'react';

import { route } from "@nextgisweb/pyramid/api";
import { WKT } from "ol/format";
import { Point } from "ol/geom";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/";

export const useGeom = () => {

    const transformFrom = async (event, value: number) => {
        const wkt = new WKT();
        const point = event.coordinate;

        const srsCoordinates = {};
        if (spatialRefSysList) {
            spatialRefSysList.forEach((srsInfo) => {
                srsCoordinates[srsInfo.id] = srsInfo;
            });
        }

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
    }

    return { transformFrom };
};
