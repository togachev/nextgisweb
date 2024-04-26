import { useCallback } from 'react';
import { route } from "@nextgisweb/pyramid/api";
import { WKT } from "ol/format";
import { Point } from "ol/geom";
import spatialRefSysList from "@nextgisweb/pyramid/api/load!api/component/spatial_ref_sys/"
import MapBrowserEvent from 'ol/MapBrowserEvent';
import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
const srsCoordinates = {};
if (spatialRefSysList) {
    spatialRefSysList.forEach((srsInfo) => {
        srsCoordinates[srsInfo.id] = srsInfo;
    });
}

export const useGeom = (tool) => {

    const displayFeatureInfo = async (event: MapBrowserEvent, value: number, op: string) => {
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

        if (op === "context") {
            return { coords };
        } else {
            const pixel = event.pixel;
            const request: RequestProps = {
                srs: 3857,
                geom: tool._requestGeomString(pixel),
                styles: [],
            };

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
                        request.styles.push({ id: item.styleId, label: item.label });
                    });
                })
            const response = await route("feature_layer.identify_module")
                .post({
                    json: request,
                })
                .then((response) => {
                    return response
                })

            return { response, coords };
        }
    };

    return { displayFeatureInfo };
};


