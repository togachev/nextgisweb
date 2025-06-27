import { useEffect, useState } from "react";
import { transform } from 'ol/proj';
import type { Display } from "@nextgisweb/webmap/display";

interface SourceProps {
    typeEvents: string;
    pixel: number[];
    clientPixel: number[];
    coordinate: number[];
    lonlat: number[];
}

const webMercator = "EPSG:3857";
const wgs84 = "EPSG:4326";

export const useClickPoint = (display: Display) => {

    const [pointClick, setPointClick] = useState<SourceProps>()

    const olmap = display.map.olMap;
    const view = display.map.olMap.getViewport();

    useEffect(() => {
        const events = ["click", "contextmenu"];
        events.map(i => {
            view.addEventListener(i, (e: any) => {
                e.preventDefault();
                const coordinate = olmap.getCoordinateFromPixel([e.layerX, e.layerY]);
                const lonlat = transform(coordinate, webMercator, wgs84).map(number => parseFloat(number.toFixed(6)));
                setPointClick({
                    typeEvents: i,
                    pixel: [e.layerX, e.layerY],
                    clientPixel: [e.clientX, e.clientY],
                    coordinate: coordinate,
                    lonlat: lonlat,
                });
            });
        })
    }, []);

    return { pointClick };
};
