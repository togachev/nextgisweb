import { RefObject, useEffect } from "react";

const getPosition = async (px, py, store) => {
    let width, height;
    if (store.isMobile && store.countFeature > 0) {
        if (store.isLandscape) {
            width = store.sizeWindow.width / 2;
            height = store.sizeWindow.height;

            /* left */
            if (
                px > store.sizeWindow.width / 2
            ) {

                return {
                    pointClick: {
                        x: store.offHP, y: store.sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: 0, width: width, height: height
                }
            }
            /* right */
            if (
                px <= store.sizeWindow.width / 2
            ) {
                return {
                    pointClick: {
                        x: store.offHP, y: store.sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: store.sizeWindow.width / 2, y: 0, width: width, height: height
                }
            }
        } else {
            width = store.sizeWindow.width;
            height = store.sizeWindow.height / 2;

            /* top */
            if (
                py <= store.sizeWindow.height / 2
            ) {

                return {
                    pointClick: {
                        x: store.offHP, y: store.sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: store.sizeWindow.height / 2, width: width, height: height
                }
            }
            /* bottom */
            if (
                py > store.sizeWindow.height / 2
            ) {
                return {
                    pointClick: {
                        x: store.offHP, y: store.sizeWindow.height - height
                    },
                    buttonZoom: { topLeft: false },
                    x: 0, y: 0, width: width, height: height
                }
            }
        }
    }
    else if (
        store.popup_width > store.sizeWindow.width ||
        store.popup_height > store.sizeWindow.height
    ) {
        width = store.sizeWindow.width;
        height = store.sizeWindow.height;
        return {
            pointClick: {
                x: store.offHP, y: store.sizeWindow.height - height
            },
            buttonZoom: { topLeft: false },
            x: 0, y: 0, width: width, height: height
        }
    }
    else if (
        (store.popup_width <= store.sizeWindow.width && store.popup_width > store.sizeWindow.width / 1.5) ||
        (store.popup_height <= store.sizeWindow.height && store.popup_height > store.sizeWindow.height / 1.5)
    ) {
        width = store.sizeWindow.width / 2;
        height = store.sizeWindow.height / 2;

        /* top left */
        if (
            py <= store.sizeWindow.height - store.offset - height
            && px <= store.sizeWindow.width - store.offset - width
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: py + store.offset, width: width, height: height
            }
        }

        /* top */
        if (
            py <= store.sizeWindow.height - store.offset - height
            && px > store.sizeWindow.width - width - store.offset
            && px < width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (store.sizeWindow.width - width) / 2, y: py + store.offset, width: width, height: height
            }
        }

        /* top right */
        if (
            py <= store.sizeWindow.height - store.offset - height
            && px >= width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - store.offset - width, y: py + store.offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            py >= height + store.offset
            && px <= store.sizeWindow.width - store.offset - width
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: py - height - store.offset, width: width, height: height
            }
        }

        /* bottom */
        if (
            py > height + store.offset
            && px > store.sizeWindow.width - width - store.offset
            && px < width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (store.sizeWindow.width - width) / 2, y: py - height - store.offset, width: width, height: height
            }
        }

        /* bottom right */
        if (
            py >= height + store.offset
            && px >= width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - width - store.offset, y: py - height - store.offset, width: width, height: height
            }
        }

        /* left */
        if (
            py > store.sizeWindow.height - store.offset - height
            && py < height + store.offset
            && px <= store.sizeWindow.width - store.offset - width
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: (store.sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* center top */
        if (
            py > store.sizeWindow.height - store.offset - height
            && py < height + store.offset
            && px > store.sizeWindow.width - store.offset - width
            && px < width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (store.sizeWindow.width - width) / 2, y: (store.sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* right */
        if (
            py > store.sizeWindow.height - store.offset - height
            && py < height + store.offset
            && px >= width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - store.offset - width, y: (store.sizeWindow.height - height) / 2, width: width, height: height
            }
        }
    }
    else if (
        (store.popup_width <= store.sizeWindow.width / 1.5 && store.popup_width >= store.sizeWindow.width / 2) ||
        (store.popup_height <= store.sizeWindow.height / 1.5 && store.popup_height >= store.sizeWindow.height / 2)
    ) {
        width = store.popup_width;
        height = store.popup_height;

        /* top left */
        if (
            py <= store.sizeWindow.height - store.offset - height
            && px <= store.sizeWindow.width - store.offset - width
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: py + store.offset, width: width, height: height
            }
        }

        /* top */
        if (
            py <= store.sizeWindow.height - store.offset - height
            && px > store.sizeWindow.width - width - store.offset
            && px < width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (store.sizeWindow.width - width) / 2, y: py + store.offset, width: width, height: height
            }
        }

        /* top right */
        if (
            py <= store.sizeWindow.height - store.offset - height
            && px >= width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - store.offset - width, y: py + store.offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            py >= height + store.offset
            && px <= store.sizeWindow.width - store.offset - width
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: py - height - store.offset, width: width, height: height
            }
        }

        /* bottom */
        if (
            py > height + store.offset
            && px > store.sizeWindow.width - width - store.offset
            && px < width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (store.sizeWindow.width - width) / 2, y: py - height - store.offset, width: width, height: height
            }
        }

        /* bottom right */
        if (
            py >= height + store.offset
            && px >= width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - width - store.offset, y: py - height - store.offset, width: width, height: height
            }
        }

        /* left */
        if (
            py > store.sizeWindow.height - store.offset - height
            && py < height + store.offset
            && px <= store.sizeWindow.width - store.offset - width
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: (store.sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* center top */
        if (
            py > store.sizeWindow.height - store.offset - height
            && py < height + store.offset
            && px > store.sizeWindow.width - store.offset - width
            && px < width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: (store.sizeWindow.width - width) / 2, y: (store.sizeWindow.height - height) / 2, width: width, height: height
            }
        }

        /* right */
        if (
            py > store.sizeWindow.height - store.offset - height
            && py < height + store.offset
            && px >= width + store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px - store.offset - width, y: (store.sizeWindow.height - height) / 2, width: width, height: height
            }
        }
    }
    else if (
        store.popup_width < store.sizeWindow.width / 2 && store.popup_height < store.sizeWindow.height / 2
    ) {
        width = store.popup_width;
        height = store.popup_height;

        /*top left*/
        if (
            py <= store.sizeWindow.height - height - store.offset
            && px <= store.sizeWindow.width - width - store.offset
        ) {
            return {
                pointClick: {
                    x: store.sizeWindow.width - width, y: store.sizeWindow.height - height
                },
                buttonZoom: { topLeft: false },
                x: px + store.offset, y: py + store.offset, width: width, height: height
            }
        }

        /*top right*/
        if (
            py <= store.sizeWindow.height - height - store.offset
            && px > store.sizeWindow.width - width - store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.sizeWindow.height - height
                },
                buttonZoom: { topRight: false },
                x: px - width - store.offset, y: py + store.offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            py > store.sizeWindow.height - height - store.offset
            && px <= store.sizeWindow.width - width
        ) {
            return {
                pointClick: {
                    x: store.sizeWindow.width - width, y: store.offHP
                },
                buttonZoom: { bottomLeft: false },
                x: px + store.offset, y: py - height - store.offset, width: width, height: height
            }
        }

        /*bottom right*/
        if (
            py > store.sizeWindow.height - height - store.offset
            && px > store.sizeWindow.width - width - store.offset
        ) {
            return {
                pointClick: {
                    x: store.offHP, y: store.offHP,
                },
                buttonZoom: { bottomRight: false },
                x: px - width - store.offset, y: py - height - store.offset, width: width, height: height
            }
        }
    }
};

const getPositionContext = async (px, py, store) => {
    let width, height;

    width = store.context_width;
    height = store.context_height;

    /*top left*/
    if (
        py <= store.sizeWindow.height - height
        && px <= store.sizeWindow.width - width
    ) {
        return {
            x: px, y: py, width: width, height: height
        }
    }

    /*top right*/
    if (
        py <= store.sizeWindow.height - height
        && px > store.sizeWindow.width - width
    ) {
        return {
            x: px - width, y: py, width: width, height: height
        }
    }

    /*bottom left*/
    if (
        py > store.sizeWindow.height - height
        && px <= store.sizeWindow.width - width
    ) {
        return {
            x: px, y: py - height, width: width, height: height
        }
    }

    /*bottom right*/
    if (
        py > store.sizeWindow.height - height
        && px > store.sizeWindow.width - width
    ) {
        return {
            x: px - width, y: py - height, width: width, height: height
        }
    }
};

const outsideClick = (ref: RefObject<HTMLElement>, handler: () => void) => {
    useEffect(() => {
        const listener = (e: MouseEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            handler();
        };
        document.addEventListener("mousedown", listener);
        return () => document.removeEventListener("mousedown", listener);
    }, [ref, handler]);
}

export { getPosition, getPositionContext, outsideClick };