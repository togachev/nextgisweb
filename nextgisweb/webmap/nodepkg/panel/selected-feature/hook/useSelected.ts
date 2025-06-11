import { useCallback, useEffect, useState } from "react";
import { WKT } from "ol/format";
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

    const simulateEvent = (p, pixel, map) => ({
        coordinate: p && p.coordinate,
        map: map,
        target: "map",
        pixel: [
            display.panelManager.getActivePanelName() !== "none" ?
                (pixel[0] + display.panelSize + 40) :
                (pixel[0] + 40), (pixel[1] + 40)
        ],
        type: "click"
    });

    const overlayInfo = (event, p) => display.imodule._overlayInfo(event, "popup", p, "selected");

    const visibleItems = ({ value, status }) => {
        const visibleStyles: number[] = [];
        const itemConfig = display.getItemConfig();
        if (value && status === false) {
            Object.keys(itemConfig).forEach(function (key) {
                if (value.styles.includes(itemConfig[key].styleId)) {
                    visibleStyles.push(itemConfig[key].id);
                }
            });
        } else {
            display.config.checkedItems.forEach(function (key) {
                visibleStyles.push(itemConfig[key].id);
            });
        }
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
                        const geometry = _wkt.readGeometry(i.geom);
                        const extent = geometry.getExtent()
                        display.imodule.zoomToExtent(extent);

                        display.map.olMap.once("postrender", function (e) {
                            const coordinate = e.map.getView().getCenter();
                            const val = { params: [] };
                            const p = { value: val, coordinate: coordinate, selected: key, data: value };
                            const pixel = e.map.getPixelFromCoordinate(coordinate);
                            const event = simulateEvent(p, pixel, e.map);
                            overlayInfo(event, p);
                        });
                    })
            } else {
                const val = { params: [] };
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