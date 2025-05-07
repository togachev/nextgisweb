import { forwardRef, RefObject } from "react";
import { createPortal } from "react-dom";
import { useOutsideClick } from "../hook/useOutsideClick";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import { gettext } from "@nextgisweb/pyramid/i18n";

import Location from "@nextgisweb/icon/material/my_location";
import type { Params, Props } from "../type";

export default forwardRef<Element>(
    function ContextComponent(props, ref) {
        const { params, visible, display, array_context } = props as Params;
        const { op, position } = params as Props;
        useOutsideClick(ref, true);
        const { copyValue, contextHolder } = useCopy();
        const imodule = display.identify_module;
        const lon = imodule.lonlat[0];
        const lat = imodule.lonlat[1];

        const coordsValue = lon + ", " + lat;
        const coordsVisible = lon.toFixed(6) + ", " + lat.toFixed(6);

        return (
            createPortal(
                <div key={new Date} ref={ref as any} className="context-position" style={{
                    width: position.width,
                    left: position.x,
                    top: position.y,
                    position: "absolute",
                }}>
                    {contextHolder}
                    <span
                        className="context-coord"
                        onClick={() => {
                            visible({ hidden: true, overlay: undefined, key: op });
                        }}
                    >
                        <span
                            className="coordinate-value"
                            title={gettext("Copy coordinates")}
                            onClick={() => { copyValue(coordsValue, gettext("Coordinates copied")) }}
                        >
                            <span className="icon-location"><Location /></span>
                            <span className="coords">{coordsVisible}</span>
                        </span>
                    </span>
                    {array_context?.map(item => {
                        if (item.visible) {
                            return (
                                <div className="context-item" key={item.key} onClick={() => {
                                    visible({ hidden: true, overlay: undefined, key: op });
                                    alert(item.result)
                                }} >
                                    <span>{item.title}</span>
                                </div>
                            )
                        }
                    })}
                </div>,
                document.body
            )
        )
    }
);