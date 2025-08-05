import { RefObject, useCallback, useEffect, useRef } from "react";
import { isMobile as isM } from "react-device-detect";
import type { Display } from "@nextgisweb/webmap/display";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

type Entry<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

const usePopup = (display: Display) => {
    const portalContext = useRef(document.createElement("div"));
    useOutsideClick(portalContext, () => display.popupStore.setContextHidden(true));

    const olmap = display.map.olMap;

    const typeClick = isM ? "singleclick" : "click";

    const contextMenu = useCallback((e) => {
        if (e.dragging) return;

        isM && olmap.un("singleclick", click);
        e.preventDefault();
        display.popupStore.overlayInfo(e, { type: "context" })

        isM && setTimeout(() => {
            olmap.on("singleclick", click);
        }, 250);
        display.popupStore.setContextHidden(false);
    }, []);

    const click = useCallback((e) => {
        if (e.dragging) return;
        display.popupStore.setMode("click");
        e.preventDefault();
        display.popupStore.overlayInfo(e, { type: "click" });
    }, [display.popupStore.pointPopupClick]);

    useEffect(() => {
        if (display.panelManager.getActivePanelName() !== "custom-layer") {
            olmap.on(typeClick, click);
            olmap.on("contextmenu", contextMenu);

            const handleResize = () => {
                display.popupStore.setSizeWindow({
                    width: window.innerWidth,
                    height: window.innerHeight,
                });
            }
            window.addEventListener("resize", handleResize);

            return () => {
                olmap.un(typeClick, click);
                olmap.un("contextmenu", contextMenu);
                window.removeEventListener("resize", handleResize);
            };
        } else {
            display.popupStore.pointDestroy();
        }
    }, [display.panelManager.activePanel]);

    useEffect(() => {
        if (display.popupStore.fixPopup) {
            display.popupStore.setFixPos(display.popupStore.valueRnd);
            display.popupStore.setFixPanel(display.popupStore.fixContentItem.key)
        } else {
            display.popupStore.setFixPos(null);
        }
    }, [display.popupStore.fixPopup]);
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

const useOutsideClick = (ref: RefObject<HTMLDivElement>, handler: () => void) => {
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
        mobileLandscape: {
            width: count > 0 ? sizeWindow.width / 2 : coords_not_count_w,
            height: count > 0 ? sizeWindow.height : coords_not_count_h,
        },
        mobilePortrait: {
            width: count > 0 ? sizeWindow.width : coords_not_count_w,
            height: count > 0 ? sizeWindow.height / 2 : coords_not_count_h,
        },
    };
    return size[key];
};

async function getPosition(display, px, py, store) {
    const { activePanel, mode, olmap, offset, offHP, isMobile, isLandscape, response, popup_width, popup_height, sizeWindow } = store;
    const count = response.featureCount;

    if (isMobile && count > 0) {
        if (isLandscape) {
            const { width, height } = configSize(store, "mobileLandscape");

            if (mode === "simulate") {
                const cc = olmap.getView().getCenter();
                const ext = olmap.getView().calculateExtent();
                const offset = activePanel === "none" ? (ext[2] - ext[0]) / 4 : 0;
                const newCenter = [cc[0] - offset, cc[1]];
                olmap.getView().setCenter(newCenter);

                // console.log("simulate");
                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: 0, width: width, height: height
                }
            }

            if (
                px > sizeWindow.width / 2
            ) {
                // console.log("left");
                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: 0, width: width, height: height
                }
            }

            if (
                px <= sizeWindow.width / 2
            ) {
                // console.log("right");
                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: sizeWindow.width / 2, y: 0, width: width, height: height
                }
            }
        } else {
            const { width, height } = configSize(store, "mobilePortrait");

            if (mode === "simulate") {

                const cc = olmap.getView().getCenter();
                const ext = olmap.getView().calculateExtent();
                const offset = activePanel === "none" ? (ext[3] - ext[1]) / 4 : 0;
                const newCenter = [cc[0], cc[1] - offset];
                olmap.getView().setCenter(newCenter);

                // console.log("simulate");
                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: sizeWindow.height / 2, width: width, height: height
                }
            }

            if (
                py <= sizeWindow.height / 2
            ) {
                // console.log("top");
                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: sizeWindow.height / 2, width: width, height: height
                }
            }

            if (
                py > sizeWindow.height / 2
            ) {
                // console.log("bottom");
                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: 0, width: width, height: height
                }
            }
        }
    }
    else if (
        !isMobile &&
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
        !isMobile &&
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topRight: false },
                x: px - offset - width, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }
    }
    else if (isMobile && count === 0) {
        const { width, height } = configSize(store, "full");

        if (
            py <= sizeWindow.height - offset - height
            && px <= sizeWindow.width - offset - width
        ) {
            // console.log("top left");
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: py + offset, width: width, height: height
            }
        }

        if (
            py <= sizeWindow.height - offset - height
            && px >= width + offset
        ) {
            // console.log("top right");
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: (sizeWindow.height - height) / 2, width: width, height: height
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
                    x: offHP, y: sizeWindow.height - height
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
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
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
        py <= sizeWindow.height - height
        && px <= sizeWindow.width - width
    ) {
        // console.log("top left");
        return {
            x: px + offset, y: py + offset, width: width, height: height
        }
    }

    if (
        py <= sizeWindow.height - height
        && px > sizeWindow.width - width
    ) {
        // console.log("top right");
        return {
            x: px - offset - width, y: py + offset, width: width, height: height
        }
    }

    if (
        py > sizeWindow.height - height
        && px <= sizeWindow.width - width
    ) {
        // console.log("bottom left");
        return {
            x: px + offset, y: py - offset - height, width: width, height: height
        }
    }

    if (
        py > sizeWindow.height - height
        && px > sizeWindow.width - width
    ) {
        // console.log("bottom right");
        return {
            x: px - offset - width, y: py - offset - height, width: width, height: height
        }
    }
};

export { getEntries, getPosition, getPositionContext, useOutsideClick, usePopup };