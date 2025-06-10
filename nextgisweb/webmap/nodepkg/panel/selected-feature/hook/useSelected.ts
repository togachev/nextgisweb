import { useCallback, useEffect, useState } from "react";
import topic from "@nextgisweb/webmap/compat/topic";
import type { Display } from "@nextgisweb/webmap/display";

export const useSelected = (display: Display) => {
    const [values, setValues] = useState();

    const simulatePointZoom = (value) => {
        setValues(value);
    };

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


    const overlayInfo = (event, p) => {
        return display.imodule._overlayInfo(event, "popup", p, "selected")
    };

    const visibleItems = (vals) => {
        const itm = vals[1];

        const visibleStyles: number[] = [];
        const itemConfig = display.getItemConfig();
        Object.keys(itemConfig).forEach(function (key) {
            if (itm.styles.includes(itemConfig[key].styleId)) {
                visibleStyles.push(itemConfig[key].id);
            }
        });
        display.webmapStore.setChecked(visibleStyles);
        display.webmapStore._updateLayersVisibility(visibleStyles);
    };

    useEffect(() => {
        if (values) {
            const itm = values.item[1];

            const value = {
                attribute: true,
                pn: "attributes",
                lon: itm.lonlat[0],
                lat: itm.lonlat[1],
                params: [{ id: itm.styleId, label: itm.desc, dop: null }],
            };

            const p = { value, coordinate: itm.coordinate, selected: values.item[0] };

            values.type === "vector" ?
                display.imodule.zoomTo({ id: itm.id, layerId: itm.layerId }) :
                display.imodule.zoomToPoint(itm.coordinate);

            display.map.olMap.once("postrender", function (e) {
                const pixel = e.map.getPixelFromCoordinate(itm.coordinate);
                const event = simulateEvent(p, pixel, e.map);
                overlayInfo(event, p);
            });
        }
    }, [values])

    return { simulatePointZoom, visibleItems };
};