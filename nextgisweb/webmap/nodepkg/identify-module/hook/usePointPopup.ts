import { useCallback } from "react";

export const usePointPopup = () => {
    const positionPopup = useCallback((event, width, height) => {
        if (
            event.originalEvent.layerX + width <= event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY + height <= event.originalEvent.srcElement.clientHeight
        ) {
            return [event.originalEvent.clientX, event.originalEvent.clientY, 'верхний левый']
        }
        
        if (
            event.originalEvent.layerX + width > event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY + height < event.originalEvent.srcElement.clientHeight
        ) {
            return [event.originalEvent.clientX - width, event.originalEvent.clientY, 'верхний правый']
        }

        if (
            event.originalEvent.layerX < event.originalEvent.srcElement.clientWidth - width
            && event.originalEvent.layerY < event.originalEvent.srcElement.clientHeight
        ) {
            return [event.originalEvent.clientX, event.originalEvent.clientY - height, 'нижний левый']
        }

        if (
            event.originalEvent.layerX < event.originalEvent.srcElement.clientWidth
            && event.originalEvent.layerY < event.originalEvent.srcElement.clientHeight
        ) {
            return [event.originalEvent.clientX - width, event.originalEvent.clientY - height, 'нижний правый']
        }
    })

    return { positionPopup };
};
