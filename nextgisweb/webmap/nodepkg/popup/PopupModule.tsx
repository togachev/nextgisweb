import { useCallback, useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import { PopupStore } from "./PopupStore";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { isMobile as isM } from "react-device-detect";
import { useOutsideClick } from "./util/function";


import type { Display } from "@nextgisweb/webmap/display";

interface PopupModuleProps {
    display: Display;
}

export default observer(
    function PopupModule({ display }: PopupModuleProps) {

        const urlParams = display.getUrlParams();
        const opts = display.config.options;
        const attrs = opts["webmap.identification_attributes"];
        const geoms = opts["webmap.identification_geometry"];

        const portalContext = useRef(document.createElement("div"));

        useOutsideClick(portalContext, () => store.setContextHidden(true));

        const [store] = useState(
            () => new PopupStore({
                display: display,
                fixPanel: urlParams.pn ? urlParams.pn :
                    attrs === true ? "attributes" :
                        attrs === false && geoms === true ? "geom_info" :
                            (attrs === false && geoms === false) && "description",
            }));

        const olmap = display.map.olMap;

        const typeClick = isM ? "singleclick" : "click";

        const contextMenu = useCallback((e) => {
            if (e.dragging) return;

            isM && olmap.un("singleclick", click);
            e.preventDefault();
            store.overlayInfo(e, { type: "context" })
            // getPositionContext(e.originalEvent.clientX, e.originalEvent.clientY, store)
            //     .then(val => {
            //         store.setPosContext(val);
            //     })
            // const lonlat = transform(e.coordinate, webMercator, wgs84);
            // store.setPointContextClick({
            //     typeEvents: "contextmenu",
            //     pixel: e.pixel,
            //     clientPixel: [e.originalEvent.clientX, e.originalEvent.clientY],
            //     coordinate: e.coordinate,
            //     lonlat: lonlat,
            // });

            isM && setTimeout(() => {
                olmap.on("singleclick", click);
            }, 250);
            store.setContextHidden(false);
        }, []);

        const click = useCallback((e) => {
            if (e.dragging) return;
            store.setMode("click");
            e.preventDefault();
            store.overlayInfo(e, { type: "click" });
        }, [store.pointPopupClick]);

        useEffect(() => {
            if (display.panelManager.getActivePanelName() !== "custom-layer") {
                olmap.on(typeClick, click);
                olmap.on("contextmenu", contextMenu);

                const handleResize = () => {
                    store.setSizeWindow({
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
                store.pointDestroy();
            }
        }, [display.panelManager.activePanel]);

        useEffect(() => {
            if (store.fixPopup) {
                store.setFixPos(store.valueRnd);
                store.setFixPanel(store.fixContentItem.key)
            } else {
                store.setFixPos(null);
            }
        }, [store.fixPopup]);


        return null;
        // console.log(store.valueRnd, store.mode);

        // return (
        //     <>
        //         {createPortal(
        //             <div
        //                 ref={portalContext}
        //                 style={{
        //                     position: "absolute",
        //                     left: store.posContext.x,
        //                     top: store.posContext.y,
        //                     backgroundColor: "#eee",
        //                     width: store.posContext.width,
        //                     height: store.posContext.height,
        //                     zIndex: 11,
        //                     display: store.contextHidden ? "none" : "block",
        //                 }}
        //             >
        //                 {lonlatContext}
        //             </div>,
        //             document.getElementById("portal-context")
        //         )}
        //</>)
    }
);