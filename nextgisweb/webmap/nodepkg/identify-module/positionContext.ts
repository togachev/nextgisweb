const positionContext = (event, offset, op, count, settings, p, array_context) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const offHP = 40;
    const context_item = 34;
    const length = array_context.filter(item => item.visible === true).length
    const px = p && p.value ? event.pixel[0] : event.originalEvent.clientX;
    const py = p && p.value ? event.pixel[1] : event.originalEvent.clientY;
    
    const context_height = 24 + context_item * length;
    const context_width = 180;
    const popup_height = settings.popup_height;
    const popup_width = settings.popup_width;
    const coords_not_count_w = 250;
    const coords_not_count_h = 51;


    let width;
    let height;

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
            return { x: px + offset, y: py - height - offset, width: width, height: height }
        }

        /* bottom */
        if (
            (W - width / 2) > px
            && width / 2 + offHP <= px
            && (H - height / 2) <= py
        ) {
            return { x: px - width / 2, y: py - height - offset, width: width, height: height }
        }

        /* bottom right */
        if (
            (W - width / 2) <= px
            && (H - height / 2) <= py
        ) {
            return { x: px - width - offset, y: py - height - offset, width: width, height: height }
        }

        /* top left */
        if (
            height / 2 + offHP >= py
            && width / 2 + offHP >= px
        ) {
            return { x: px + offset, y: py + offset, width: width, height: height }
        }

        /* top */
        if (
            height / 2 + offHP >= py
            && (width / 2) < px
            && (W - width / 2) > px
        ) {
            return { x: px - width / 2, y: py + offset, width: width, height: height }
        }

        /* top right */
        if (
            height / 2 + offHP >= py
            && (W - width / 2) <= px
        ) {
            return { x: px - offset - width, y: py + offset, width: width, height: height }
        }

        /* left */
        if (
            height / 2 + offHP < py
            && (H - height / 2) > py
            && width / 2 + offHP > px
        ) {
            return { x: px + offset, y: py - height / 2, width: width, height: height }
        }

        /* right */
        if (
            height / 2 + offHP < py
            && (H - height / 2) > py
            && (W - width / 2) <= px
        ) {
            return { x: px - offset - width, y: py - height / 2, width: width, height: height }
        }

        /* center */
        if (
            height / 2 + offHP < py
            && (H - height / 2) > py
            && width / 2 + offHP < px
            && (W - width / 2) > px
        ) {
            return { x: px - width / 2, y: py - height / 2, width: width, height: height }
        }
    }

    if (height < H / 2 || width < W / 2) {
        /*top left*/
        if (
            H - height - offset >= py
            && W - width - offset >= px
        ) {
            return { x: px + offset, y: py + offset, width: width, height: height }
        }

        /*top right*/
        if (
            H - height - offset >= py
            && W - width - offset < px
        ) {
            return { x: px - width - offset, y: py + offset, width: width, height: height }
        }

        /*bottom left*/
        if (
            H - height - offset < py
            && W - width >= px
        ) {
            return { x: px + offset, y: py - height - offset, width: width, height: height }
        }

        /*bottom right*/
        if (
            W - width - offset < px
            && H - height - offset < py
        ) {
            return { x: px - width - offset, y: py - height - offset, width: width, height: height }
        }
    }
};

export { positionContext };