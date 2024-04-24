import { useCallback, useState } from 'react';

import { route } from "@nextgisweb/pyramid/api";
import { WKT } from "ol/format";
import { Point } from "ol/geom";

export const useGeom = () => {

    const toWGS84 = useCallback(async (event) => {
        const wkt = new WKT();
        const point = event.coordinate;

        const coords = await route("spatial_ref_sys.geom_transform.batch")
            .post({
                json: {
                    srs_from: 3857,
                    srs_to: [4326],
                    geom: wkt.writeGeometry(new Point(point)),
                },
            })
            .then((transformed) => {
                const wktPoint = wkt.readGeometry(transformed[0].geom);
                const transformedCoord = wktPoint.getCoordinates();
                return transformedCoord;
            });
        return coords;
    })

    return { toWGS84 };
};
