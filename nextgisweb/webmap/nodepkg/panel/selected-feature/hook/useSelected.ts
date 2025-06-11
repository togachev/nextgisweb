import { useCallback, useEffect, useState } from "react";
import topic from "@nextgisweb/webmap/compat/topic";
import { WKT } from "ol/format";
import { Point } from "ol/geom";
import type { DataProps } from "@nextgisweb/webmap/imodule/type";
import type { Display } from "@nextgisweb/webmap/display";

type Props = {
    key: string;
    value: DataProps;
    type: string;
}

export const useSelected = (display: Display) => {
    const [data, setData] = useState<Props>();

    const simulatePointZoom = useCallback((value) => setData(value), []);

    const simulateEvent = useCallback((p, pixel, map) => ({
        coordinate: p && p.coordinate,
        map: map,
        target: "map",
        pixel: [
            display.panelManager.getActivePanelName() !== "none" ?
                (pixel[0] + display.panelSize + 40) :
                (pixel[0] + 40), (pixel[1] + 40)
        ],
        type: "click"
    }), []);

    const overlayInfo = useCallback((event, p) => display.imodule._overlayInfo(event, "popup", p, "selected"), []);

    const visibleItems = ({ value }) => {
        const visibleStyles: number[] = [];
        const itemConfig = display.getItemConfig();
        Object.keys(itemConfig).forEach(function (key) {
            if (value.styles.includes(itemConfig[key].styleId)) {
                visibleStyles.push(itemConfig[key].id);
            }
        });
        display.webmapStore.setChecked(visibleStyles);
        display.webmapStore._updateLayersVisibility(visibleStyles);
    };

    useEffect(() => {
        if (data) {
            const { key, value, type } = data;

            if (type === "vector") {
                display.imodule.getFeature(value)
                    .then(i => {
                        const _wkt = new WKT();
                        const line = _wkt.readGeometry(i.geom)

                        display.imodule.transformCoordinate(
                            display.imodule.displaySrid,
                            display.imodule.srsMap.keys(),
                            line.getFirstCoordinate()
                        )
                            .then((transformedCoord) => {
                                const val = {
                                    attribute: true,
                                    pn: "attributes",
                                    lon: transformedCoord[0],
                                    lat: transformedCoord[1],
                                    params: [{ id: value.styleId, label: value.desc, dop: null }],
                                };

                                const p = { value: val, coordinate: value.coordinate, selected: key, data: value };
                                display.imodule.zoomTo({ id: value.id, layerId: value.layerId })
                                display.map.olMap.once("postrender", function (e) {
                                    const pixel = e.map.getPixelFromCoordinate(value.coordinate);
                                    const event = simulateEvent(p, pixel, e.map);
                                    overlayInfo(event, p);
                                });
                            })
                    })
            } else {
                const val = {
                    attribute: true,
                    pn: "attributes",
                    lon: value.lonlat[0],
                    lat: value.lonlat[1],
                    params: [{ id: value.styleId, label: value.desc, dop: null }],
                };
                const p = { value: val, coordinate: value.coordinate, selected: key, data: value };
                display.imodule.zoomToPoint(value.coordinate);
                display.map.olMap.once("postrender", function (e) {
                    const pixel = e.map.getPixelFromCoordinate(value.coordinate);
                    const event = simulateEvent(p, pixel, e.map);
                    overlayInfo(event, p);
                });
            }
        }
    }, [data])

    return { simulatePointZoom, visibleItems };
};