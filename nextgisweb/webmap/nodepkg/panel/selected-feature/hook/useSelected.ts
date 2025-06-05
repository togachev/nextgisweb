import { useCallback, useEffect, useState } from "react";

import type { Display } from "@nextgisweb/webmap/display";

export const useSelected = (display: Display) => {
    const [item, setItem] = useState();

    const simulatePointZoom = (item) => {
        setItem(item);
    };

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
    }), [item]);


    const overlayInfo = useCallback((event, p) => {
        return display.imodule._overlayInfo(event, "popup", p, "simulate")
    }, [item]);

    useEffect(() => {
        if (item) {
            const itm = item[1];

            const value = {
                attribute: true,
                pn: "attributes",
                lon: itm.lonlat[0],
                lat: itm.lonlat[1],
                params: [{ id: itm.styleId, label: itm.desc, dop: null }],
            };

            const p = { value, coordinate: itm.coordinate, selected: item[0] };
            const pixel = display.map.olMap.getPixelFromCoordinate(itm.coordinate);
            const event = simulateEvent(p, pixel, display.map.olMap);

            overlayInfo(event, p);
            display.imodule.zoomToExtent(itm.extent);

            display.map.olMap.once("postrender", function (e) {
                const p = { value, coordinate: itm.coordinate, selected: item[0] };
                const pixel = e.map.getPixelFromCoordinate(itm.coordinate);
                const event = simulateEvent(p, pixel, e.map);
                overlayInfo(event, p);
            })
        }
    }, [item, display.mapExtentDeferred])

    return { simulatePointZoom };
};