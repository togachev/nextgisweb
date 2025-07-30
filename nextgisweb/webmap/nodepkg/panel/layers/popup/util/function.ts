import { RefObject, useEffect } from "react";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

export const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

type Entry<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T];

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
        size15: {
            width: count > 0 ? sizeWindow.width * 0.65 : coords_not_count_w,
            height: count > 0 ? sizeWindow.height * 0.65 : coords_not_count_h,
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

async function getPosition(px, py, store) {
    const { offset, offHP, isMobile, isLandscape, response, popup_width, popup_height, sizeWindow } = store;
    const count = response.featureCount;
    if (isMobile && count > 0) {
        if (isLandscape) {
            const { width, height } = configSize(store, "mobileLandscape");

            /* left */
            if (
                px > sizeWindow.width / 2
            ) {

                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: 0, width: width, height: height
                }
            }
            /* right */
            if (
                px <= sizeWindow.width / 2
            ) {
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

            /* top */
            if (
                py <= sizeWindow.height / 2
            ) {

                return {
                    pointClick: {
                        x: offHP, y: sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: sizeWindow.height / 2, width: width, height: height
                }
            }
            /* bottom */
            if (
                py > sizeWindow.height / 2
            ) {
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
        (popup_width <= sizeWindow.width && popup_width > sizeWindow.width / 1.5) ||
        (popup_height <= sizeWindow.height && popup_height > sizeWindow.height / 1.5)
    ) {
        const { width, height } = configSize(store, "size15");

        /* top left */
        if (
            py <= sizeWindow.height - offset - height
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: py + offset, width: width, height: height
            }
        }

        /* top */
        if (
            py <= sizeWindow.height - offset - height
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: py + offset, width: width, height: height
            }
        }

        /* top right */
        if (
            py <= sizeWindow.height - offset - height
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - offset - width, y: py + offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            py >= height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom */
        if (
            py > height + offset
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom right */
        if (
            py >= height + offset
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - width - offset, y: py - height - offset, width: width, height: height
            }
        }

        /* left */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* center top */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px > sizeWindow.width - offset - width
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* right */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - offset - width, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }
    }
    else if (
        !isMobile &&
        (popup_width <= sizeWindow.width / 1.5) ||
        (popup_height <= sizeWindow.height / 1.5)
    ) {
        const { width, height } = configSize(store, "full");

        /* top left */
        if (
            py <= sizeWindow.height - offset - height
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: py + offset, width: width, height: height
            }
        }

        /* top */
        if (
            py <= sizeWindow.height - offset - height
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: py + offset, width: width, height: height
            }
        }

        /* top right */
        if (
            py <= sizeWindow.height - offset - height
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topRight: false },
                x: px - offset - width, y: py + offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            py >= height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom */
        if (
            py > height + offset
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { bottomLeft: false },
                x: (sizeWindow.width - width) / 2, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom right */
        if (
            py >= height + offset
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { bottomRight: false },
                x: px - width - offset, y: py - height - offset, width: width, height: height
            }
        }

        /* left */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* center top */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px > sizeWindow.width - offset - width
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* right */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px >= width + offset
        ) {
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

        /* top left */
        if (
            py <= sizeWindow.height - offset - height
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: py + offset, width: width, height: height
            }
        }

        /* top */
        if (
            py <= sizeWindow.height - offset - height
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: py + offset, width: width, height: height
            }
        }

        /* top right */
        if (
            py <= sizeWindow.height - offset - height
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topRight: false },
                x: px - offset - width, y: py + offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            py >= height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom */
        if (
            py > height + offset
            && px > sizeWindow.width - width - offset
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { bottomLeft: false },
                x: (sizeWindow.width - width) / 2, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom right */
        if (
            py >= height + offset
            && px >= width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { bottomRight: false },
                x: px - width - offset, y: py - height - offset, width: width, height: height
            }
        }

        /* left */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px <= sizeWindow.width - offset - width
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* center top */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px > sizeWindow.width - offset - width
            && px < width + offset
        ) {
            return {
                pointClick: {
                    x: offHP, y: sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (sizeWindow.width - width) / 2, y: (sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* right */
        if (
            py > sizeWindow.height - offset - height
            && py < height + offset
            && px >= width + offset
        ) {
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

    /*top left*/
    if (
        py <= sizeWindow.height - height
        && px <= sizeWindow.width - width
    ) {
        return {
            x: px + offset, y: py + offset, width: width, height: height
        }
    }

    /*top right*/
    if (
        py <= sizeWindow.height - height
        && px > sizeWindow.width - width
    ) {
        return {
            x: px - offset - width, y: py + offset, width: width, height: height
        }
    }

    /*bottom left*/
    if (
        py > sizeWindow.height - height
        && px <= sizeWindow.width - width
    ) {
        return {
            x: px + offset, y: py - offset - height, width: width, height: height
        }
    }

    /*bottom right*/
    if (
        py > sizeWindow.height - height
        && px > sizeWindow.width - width
    ) {
        return {
            x: px - offset - width, y: py - offset - height, width: width, height: height
        }
    }
};

export { getPosition, getPositionContext, useOutsideClick };