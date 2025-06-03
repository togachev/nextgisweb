import { useState, useEffect } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { PointClick } from "@nextgisweb/webmap/icon";
import topic from "@nextgisweb/webmap/compat/topic";

import type { Params, Props } from "../type";

export default function PopupClick({ display, event, params, countFeature }: Params) {
    const { response, selected: value } = params as Props;
    const selectVal = value ? value : response.data[0];

    const [selected, setSelected] = useState(value);
    const [visible, setVisible] = useState<boolean>(true);

    useEffect(() => {
        setVisible(true);
        setSelected(selectVal);
    }, [event, response])

    topic.subscribe("visible.point", (e) => {
        setSelected(e);
        setVisible(true);
    });

    topic.subscribe("unvisible.point", () => {
        setVisible(false);
    });

    return (
        <span
            style={{
                display: visible ? "block" : "none",
                cursor: countFeature > 0 && display.imodule.activePoint ? "pointer" : "auto",
            }}
            className="icon-position"
            onClick={() => {
                if (countFeature > 0 && display.imodule.activePoint) {
                    selected?.type === "vector" ? display.imodule.zoomTo(selected) :
                        selected?.type === "raster" ? display.imodule.zoomToRasterExtent(selected) :
                            undefined
                    setVisible(false);
                }
            }}>
            <span
                style={{ fontWeight: 500 }}
                title={countFeature > 0 && display.imodule.activePoint ? selected?.type === "vector" ?
                    gettext("Zoom to feature") :
                    gettext("Zoom to raster layer") : undefined}>
                <PointClick />
            </span>
        </span>
    )
};