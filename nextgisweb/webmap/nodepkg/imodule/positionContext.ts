const positionContext = (event, offset, op, count, settings, p, array_context, offHP) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const context_item = 34;
    const length = array_context.filter(item => item.visible === true).length

    /* customizing the output of event results when listening to a click or context menu (mouse/touchscreen) */
    const pointerType = event.originalEvent ? event.originalEvent.pointerType : event.pointerType;
    const px = p && p.value ? event.pixel[0] : pointerType === "mouse" ? event.originalEvent.clientX : event.clientX;
    const py = p && p.value ? event.pixel[1] : pointerType === "mouse" ? event.originalEvent.clientY : event.clientY;

    const context_height = 24 + context_item * length;
    const context_width = 200;
    const popup_height = settings.popup_size.height;
    const popup_width = settings.popup_size.width;
    const coords_not_count_w = 270;
    const coords_not_count_h = 51;

    let width, height;

    if (count === 0 && op === "context") {
        width = context_width;
        height = context_height;
    } else if (count === 0 && op !== "context") {
        width = coords_not_count_w;
        height = coords_not_count_h;
    } else if (p && p.value.attribute === false) {
        width = coords_not_count_w;
        height = coords_not_count_h;
    } else if (popup_width >= W / 2 || popup_height >= H / 2) {
        width = W / 2;
        height = H / 2;
    } else {
        width = popup_width;
        height = popup_height;
    }

    if (H <= (context_height) * 2) {
        if (op === "context") {
            width = context_width;
            height = (H - offHP) <= context_height ? (H - offHP) * .8 : context_height;
            return { x: W - width, y: 0 + offHP, width: width, height: height }
        }
    }

    if (height >= H / 2 || width >= W / 2) {
        /*bottom left*/
        if (
            width / 2 + offHP >= px
            && (H - height / 2) < py
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom */
        if (
            (W - width / 2) > px
            && width / 2 + offHP <= px
            && (H - height / 2) <= py
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px - width / 2, y: py - height - offset, width: width, height: height
            }
        }

        /* bottom right */
        if (
            (W - width / 2) <= px
            && (H - height / 2) <= py
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px - width - offset, y: py - height - offset, width: width, height: height
            }
        }

        /* top left */
        if (
            height / 2 + offHP >= py
            && width / 2 + offHP >= px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py + offset, width: width, height: height
            }
        }

        /* top */
        if (
            height / 2 + offHP >= py
            && (width / 2) < px
            && (W - width / 2) > px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px - width / 2, y: py + offset, width: width, height: height
            }
        }

        /* top right */
        if (
            height / 2 + offHP >= py
            && (W - width / 2) <= px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px - offset - width, y: py + offset, width: width, height: height
            }
        }

        /* left */
        if (
            height / 2 + offHP < py
            && (H - height / 2) > py
            && width / 2 + offHP > px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py - height / 2, width: width, height: height
            }
        }

        /* right */
        if (
            height / 2 + offHP < py
            && (H - height / 2) > py
            && (W - width / 2) <= px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px - offset - width, y: py - height / 2, width: width, height: height
            }
        }

        /* center */
        if (
            height / 2 + offHP < py
            && (H - height / 2) > py
            && width / 2 + offHP < px
            && (W - width / 2) > px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { bottomLeft: false },
                x: px - width / 2, y: py - height / 2, width: width, height: height
            }
        }
    }

    if (height < H / 2 || width < W / 2) {
        /*top left*/
        if (
            H - height - offset >= py
            && W - width - offset >= px
        ) {
            return {
                pointClick: {
                    x: window.innerWidth - width, y: window.innerHeight - height
                },
                buttonZoom: { topLeft: false },
                x: px + offset, y: py + offset, width: width, height: height
            }
        }

        /*top right*/
        if (
            H - height - offset >= py
            && W - width - offset < px
        ) {
            return {
                pointClick: {
                    x: offHP, y: window.innerHeight - height
                },
                buttonZoom: { topRight: false },
                x: px - width - offset, y: py + offset, width: width, height: height
            }
        }

        /*bottom left*/
        if (
            H - height - offset < py
            && W - width >= px
        ) {
            return {
                pointClick: {
                    x: window.innerWidth - width, y: offHP
                },
                buttonZoom: { bottomLeft: false },
                x: px + offset, y: py - height - offset, width: width, height: height
            }
        }

        /*bottom right*/
        if (
            W - width - offset < px
            && H - height - offset < py
        ) {
            return {
                pointClick: {
                    x: offHP, y: offHP,
                },
                buttonZoom: { bottomRight: false },
                x: px - width - offset, y: py - height - offset, width: width, height: height
            }
        }
    }
};

export { positionContext };