import type { Feature as OlFeature, FeatureLike } from "ol";
import Feature from "ol/Feature";
import { Vector as VectorSource } from "ol/source";
import type { Vector as OlVectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import type { Vector as OlVectorLayer } from "ol/layer";
import { customStyle, clickStyle } from "../constant";
import { useEffect, useState } from "react";


import type { Display } from "@nextgisweb/webmap/display";

interface SourceProps {
    layerX: number;
    layerY: number;
    clientX: number;
    clientY: number;
    coordinate: number[];
}

export const useFeatures = (display: Display) => {

    const [source, setSource] = useState<SourceProps>()

    const olmap = display.map.olMap;
    const view = display.map.olMap.getViewport();

    useEffect(() => {
        // view.addEventListener("click", (e: any) => {
        //     if (e.pointerType === "touch") {
        //         e.preventDefault();

        //         setSource({ layerX: e.layerX, layerY: e.layerY, clientX: e.clientX, clientY: e.clientY, coordinate: olmap.getCoordinateFromPixel([e.layerX, e.layerY]) });
        //     }
        // });

        // view.addEventListener("contextmenu", (e: any) => {
        //     if (e.pointerType === "touch") {
        //         e.preventDefault();
        //         setSource({ layerX: e.layerX, layerY: e.layerY, clientX: e.clientX, clientY: e.clientY, coordinate: olmap.getCoordinateFromPixel([e.layerX, e.layerY]) });
        //     }
        // });

        view.addEventListener("click", (e: any) => {
            e.preventDefault();
            if (e.pointerType === "mouse") {
                console.log("singleclick mouse");
                setSource({ layerX: e.layerX, layerY: e.layerY, clientX: e.clientX, clientY: e.clientY, coordinate: olmap.getCoordinateFromPixel([e.layerX, e.layerY]) });
            }
        });

        olmap.on("singleclick", (e: any) => {
            e.preventDefault();
            if (e.originalEvent.pointerType === "mouse") {
                console.log("singleclick");
                setSource({ layerX: e.pixel[0], layerY: e.pixel[1], clientX: e.originalEvent.clientX, clientY: e.originalEvent.clientY, coordinate: olmap.getCoordinateFromPixel(e.pixel) });
            }
        });

        // view.addEventListener("contextmenu", (e: any) => {
        //     if (e.pointerType === "mouse") {
        //         e.preventDefault();
        //         setSource({ layerX: e.layerX, layerY: e.layerY, clientX: e.clientX, clientY: e.clientY, coordinate: olmap.getCoordinateFromPixel([e.layerX, e.layerY]) });
        //     }
        // });
    }, []);

    return { source };
};
