import { useCallback, useEffect, useState } from "react";
import { transform } from "ol/proj";
import { observer } from "mobx-react-lite";
import { useOutsideClick } from "./useOutsideClick";
import { Store } from "./Store";

import type { Display } from "@nextgisweb/webmap/display";

import "./PopupComponent.less";

interface PopupProps {
    display: Display;
}

const webMercator = "EPSG:3857";
const wgs84 = "EPSG:4326";

export default observer(
    function PopupComponent({ display }: PopupProps) {
        const [store] = useState(
            () => new Store({
                display: display,
            }));

        const olmap = display.map.olMap;

        useOutsideClick(store.refContext);

        const contextMenu = useCallback((e) => {
            if (store.refContext.current) {
                store.refContext.current.hidden = false
            }

            olmap.un("singleclick", singleClick);
            e.preventDefault();
            const lonlat = transform(e.coordinate, webMercator, wgs84).map(number => parseFloat(number.toFixed(6)));
            store.setPointContextClick({
                typeEvents: "contextmenu",
                pixel: e.pixel,
                clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                coordinate: e.coordinate,
                lonlat: lonlat,
            });

            setTimeout(() => {
                olmap.on("singleclick", singleClick);
            }, 250);
            store.renderContext(lonlat)
        }, []);

        const singleClick = useCallback((e) => {
            e.preventDefault();
            const lonlat = transform(e.coordinate, webMercator, wgs84).map(number => parseFloat(number.toFixed(6)));
            store.setPointPopupClick({
                typeEvents: "singleclick",
                pixel: e.pixel,
                clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
                coordinate: e.coordinate,
                lonlat: lonlat,
            });
            store.renderPopup(e.coordinate, "test")
        }, []);

        useEffect(() => {
            olmap.on("contextmenu", contextMenu);
            olmap.on("singleclick", singleClick);

            return () => {
                olmap.un("contextmenu", contextMenu);
                olmap.un("singleclick", singleClick);
            };
        }, []);

        return <></>;
    }
);