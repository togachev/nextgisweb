import { RefObject, useCallback, useEffect } from "react";
import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";
import type { Display } from "@nextgisweb/webmap/display";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

type Entry<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

const usePopup = (display: Display) => {
    const store = display.popupStore;
    const olmap = display.map.olMap;

    const contextMenu = useCallback((e) => {
        if (isM) return;
        if (e.dragging) return;
        e.preventDefault();
        store.overlayInfo(e, { type: "contextmenu" })
        store.setContextHidden(false);
    }, []);

    const click = useCallback((e) => {
        if (isM) return;
        if (e.dragging) return;
        store.setMode("click");
        e.preventDefault();
        store.overlayInfo(e, { type: "click" });
    }, [store.pointPopupClick]);

    useEffect(() => {
        if (display.panelManager.getActivePanelName() !== "custom-layer") {
            olmap.on("click", click);
            olmap.on("contextmenu", contextMenu);

            const handleResize = () => {
                store.setSizeWindow({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }
            window.addEventListener("resize", handleResize);

            return () => {
                olmap.un("click", click);
                olmap.un("contextmenu", contextMenu);
                window.removeEventListener("resize", handleResize);
            };
        } else {
            store.pointDestroy();
        }
    }, [display.panelManager.activePanel]);

    useEffect(() => {
        if (store.fixPopup) {
            store.setFixPos(store.valueRnd);
            store.setFixPanel(store.fixContentItem?.key)
        } else {
            store.setFixPos(null);
        }
    }, [store.fixPopup]);
};

export const filterObject = <T extends object>(
    obj: T,
    fn: (entry: Entry<T>, i: number, arr: Entry<T>[]) => boolean,
): Partial<T> => {
    const next = { ...obj };

    const entries: Entry<T>[] = [];

    for (const key in obj) {
        entries.push([key, obj[key]]);
    }

    for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        if (!fn(entry, i, entries)) {
            delete next[entry[0]];
        }
    }

    return next;
}

const useOutsideClick = (ref: RefObject<HTMLDivElement | null>, handler: () => void) => {
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            handler();
        };
        document.addEventListener("mousedown", listener);
        return () => document.removeEventListener("mousedown", listener);
    }, [ref, handler]);
};

const configSize = (store, key) => {
    const { coords_not_count_w, coords_not_count_h, response, popup_width, popup_height, sizeWindow } = store;
    const count = response.featureCount;
    const size = {
        full: {
            width: response.featureCount > 0 ? popup_width : coords_not_count_w,
            height: response.featureCount > 0 ? popup_height : coords_not_count_h,
        },
        one: {
            width: count > 0 ? sizeWindow.width : coords_not_count_w,
            height: count > 0 ? sizeWindow.height : coords_not_count_h,
        },
    };
    return size[key];
};

async function getPosition(px, py, store) {
    const { display, offset, offHP, popup_width, popup_height, sizeWindow } = store;

    if (
        popup_width > sizeWindow.width ||
        popup_height > sizeWindow.height
    ) {
        const { width, height } = configSize(store, "one");
        return {
            pointClick: {
                x: offHP, y: sizeWindow.height - height
            },
            buttonZoom: { topLeft: false },
            x: 0, y: 0, width: width, height: height
        }
    }
    else if (
        (popup_width <= sizeWindow.width) ||
        (popup_height <= sizeWindow.height)
    ) {
        const { width, height } = configSize(store, "full");

        if (
            py <= sizeWindow.height - offset - height
            && px <= sizeWindow.width - offset - width
        ) {
            // console.log("top left");
            return {
                pointClick: {
                    x: sizeWindow.width - width, y: sizeWindow.height - height - offHP
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: py + offset, width: width, height: height
            }
        }

        if (
            py <= sizeWindow.height - offset - height
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            // console.log("top");
            return {
                pointClick: {
                    x: 0, y: sizeWindow.height - height - offHP
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width + (display.isMobile ? 0 : offHP) - width) / 2,
                y: py + offset, width: width, height: height
            }
        }

        if (
            py <= sizeWindow.height - offset - height
            && px >= width + offset
        ) {
            // console.log("top right");
            return {
                pointClick: {
                    x: 0, y: sizeWindow.height - height - offHP
                },
                buttonZoom: { topRight: false },
                x: px - offset - width, y: py + offset, width: width, height: height
            }
        }

        if (
            py >= height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            // console.log("bottom left");
            return {
                pointClick: {
                    x: sizeWindow.width - width, y: 0
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py - height - offset, width: width, height: height
            }
        }

        if (
            py > height + offset
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            // console.log("bottom");
            return {
                pointClick: {
                    x: 0, y: 0 - offHP
                },
                buttonZoom: { bottomLeft: false },
                x: (sizeWindow.width - width) / 2, y: py - height - offset, width: width, height: height
            }
        }

        if (
            py >= height + offset
            && px >= width + offset
        ) {
            // console.log("bottom right");
            return {
                pointClick: {
                    x: 0, y: 0,
                },
                buttonZoom: { bottomRight: false },
                x: px - width - offset, y: py - height - offset, width: width, height: height
            }
        }

        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            // console.log("left");
            return {
                pointClick: {
                    x: sizeWindow.width - width, y: sizeWindow.height - height - offHP
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: (sizeWindow.height + (display.isMobile ? 0 : offHP) - height) / 2, width: width, height: height
            }
        }

        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px > sizeWindow.width - offset - width
            && px < width + offset
        ) {
            // console.log("center top");
            return {
                pointClick: {
                    x: 0, y: sizeWindow.height - height - offHP
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px >= width + offset
        ) {
            // console.log("right");
            return {
                pointClick: {
                    x: sizeWindow.width - width, y: 0
                },
                buttonZoom: { topRight: false },
                x: px - offset - width, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }
    }
};

async function getPositionContext(px, py, store) {
    const { context_height, context_width, offset, sizeWindow } = store;
    const width = context_width;
    const height = context_height;

    if (
        py <= sizeWindow.height - offset - height
        && px <= sizeWindow.width - offset - width
    ) {
        // console.log("top left contextmenu");
        return {
            x: px + offset, y: py + offset, width: width, height: height
        }
    }

    if (
        py <= sizeWindow.height - offset - height
        && px >= width + offset
    ) {
        // console.log("top right contextmenu");
        return {
            x: px - offset - width, y: py + offset, width: width, height: height
        }
    }

    if (
        py >= height + offset
        && px <= sizeWindow.width - offset - width
    ) {
        // console.log("bottom left contextmenu");
        return {
            x: px + offset, y: py - offset - height, width: width, height: height
        }
    }

    if (
        py >= height + offset
        && px >= width + offset
    ) {
        // console.log("bottom right contextmenu");
        return {
            x: px - offset - width, y: py - offset - height, width: width, height: height
        }
    }
};

export { getEntries, getPosition, getPositionContext, useOutsideClick, usePopup };