import type { Coordinate } from "ol/coordinate";
import { useCallback, useEffect, useRef } from "react";

import reactApp from "@nextgisweb/gui/react-app";
import type { Display } from "@nextgisweb/webmap/display";
import PrintMap from "@nextgisweb/webmap/print-map";

import type { PrintMapSettings } from "../../../print-map/type";

interface PrintMapCompProps {
    settings: PrintMapSettings;
    display: Display;
    getCenterFromUrl: () => Coordinate | null;
    onScaleChange: (scale: number) => void;
    onCenterChange: (center: Coordinate) => void;
}

type Comp = ReturnType<typeof reactApp<PrintMapCompProps>>;

export function usePrintMap({
    settings,
    display,
    getCenterFromUrl,
    onScaleChange,
    onCenterChange,
}: PrintMapCompProps) {
    const resizeObserver = useRef<ResizeObserver>();
    const printMapComp = useRef<Comp>();
    const printMapEl = useRef<HTMLElement>();

    const destroy = useCallback(() => {
        // Schedule cleanup to avoid synchronous unmounting
        setTimeout(() => {
            if (resizeObserver.current) {
                resizeObserver.current.disconnect();
                resizeObserver.current = undefined;
            }
            if (printMapComp.current) {
                printMapComp.current.unmount();
                printMapComp.current = undefined;
            }
            if (printMapEl.current) {
                printMapEl.current.remove();
                printMapEl.current = undefined;
            }
        }, 0);
    }, []);

    const createPrintMapComp = useCallback(() => {
        if (!display.mapNode) {
            throw new Error("Display is not started yet!");
        }

        const div = document.createElement("div");
        div.classList.add("print-map-pane");
        document.body.appendChild(div);

        const resizeObserver_ = new ResizeObserver((entries) => {
            const mapContainer = entries[0].target;
            const { left, top } = mapContainer.getBoundingClientRect();
            div.style.left = `${left}px`;
            div.style.top = `${top}px`;
        });

        resizeObserver_.observe(display.mapNode);

        const comp: ReturnType<typeof reactApp<PrintMapCompProps>> = reactApp(
            PrintMap,
            {
                settings,
                display,
                initCenter: getCenterFromUrl(),
                onScaleChange,
                onCenterChange,
            },
            div
        );

        resizeObserver.current = resizeObserver_;
        printMapComp.current = comp;
        printMapEl.current = div;
    }, [display, getCenterFromUrl, onCenterChange, onScaleChange, settings]);

    useEffect(() => {
        if (printMapComp.current) {
            printMapComp.current.update({ settings });
        }
    }, [settings]);

    useEffect(() => {
        return () => {
            destroy();
        };
    }, [destroy]);

    return {
        createPrintMapComp,
        resizeObserver,
        printMapEl,
        destroy,
    };
}
