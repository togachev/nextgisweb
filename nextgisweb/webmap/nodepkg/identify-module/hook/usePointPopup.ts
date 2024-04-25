export const usePointPopup = () => {

    const positionPopup = (event, width, height) => {
        /*top left*/
        if (
            event.originalEvent.layerX + width <= event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY + height <= event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX, y: event.originalEvent.clientY }
        }

        /*top right*/
        if (
            event.originalEvent.layerX + width > event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY + height < event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX - width, y: event.originalEvent.clientY }
        }

        /*bottom left*/
        if (
            event.originalEvent.layerX < event.originalEvent.srcElement.clientWidth - width
            && event.originalEvent.layerY < event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX, y: event.originalEvent.clientY - height }
        }

        /*bottom right*/
        if (
            event.originalEvent.layerX < event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY < event.originalEvent.srcElement.clientHeight
        ) {
            return { x: event.originalEvent.clientX - width, y: event.originalEvent.clientY - height }
        }
    }

    return { positionPopup };
};
