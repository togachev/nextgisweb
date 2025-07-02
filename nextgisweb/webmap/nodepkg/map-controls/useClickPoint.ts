import { useCallback, useEffect, useState } from "react";
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

    const contextMenu = useCallback((e) => {
        olmap.un('singleclick', singleClick);
        e.preventDefault();
        const lonlat = transform(e.coordinate, webMercator, wgs84).map(number => parseFloat(number.toFixed(6)));
        setPointClick({
            typeEvents: "contextmenu",
            pixel: e.pixel,
            clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
            coordinate: e.coordinate,
            lonlat: lonlat,
        });
        setTimeout(() => {
            olmap.on('singleclick', singleClick);
        }, 250)
    }, []);

    const singleClick = useCallback((e) => {
        e.preventDefault();
        const lonlat = transform(e.coordinate, webMercator, wgs84).map(number => parseFloat(number.toFixed(6)));
        setPointClick({
            typeEvents: "singleclick",
            pixel: e.pixel,
            clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
            coordinate: e.coordinate,
            lonlat: lonlat,
        });
    }, []);

    useEffect(() => {
        olmap.on("contextmenu", contextMenu);
        olmap.on("singleclick", singleClick);

        return () => {
            olmap.un('contextmenu', contextMenu);
            olmap.un('singleclick', singleClick);
        };
    }, []);

    return { pointClick };
};
