import { useCallback, useEffect, useState } from "react";

export const usePointPopup = () => {

    const positionPopup = useCallback((e, width, height) => {
        /*top left*/
        if (
            e.pixel[0] + width <= e.originalEvent.srcElement.clientWidth
            && e.pixel[1] + height <= e.originalEvent.srcElement.clientHeight
        ) {
            return [0, 0]
        }
        /*top right*/
        else if (
            e.pixel[0] + width > e.originalEvent.srcElement.clientWidth
            && e.pixel[1] + height < e.originalEvent.srcElement.clientHeight
        ) {
            return [-width, 0]
        }
        /*bottom left*/
        else if (
            e.pixel[0] < e.originalEvent.srcElement.clientWidth - width
            && e.pixel[1] < e.originalEvent.srcElement.clientHeight
        ) {
            return [0, -height]
        }
        /*bottom right*/
        else if (
            e.pixel[0] < e.originalEvent.srcElement.clientWidth
            && e.pixel[1] < e.originalEvent.srcElement.clientHeight
        ) {
            return [-width, -height]
        }
    })

    return { positionPopup };
};
