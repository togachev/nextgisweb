import { useEffect, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { PointClick } from "@nextgisweb/webmap/icon";
import topic from "@nextgisweb/webmap/compat/topic";

import type { HighlightEvent } from "@nextgisweb/webmap/feature-highlighter/FeatureHighlighter";
import type { Params, Props } from "../type";

export default function PopupClick({ store, event, params }: Params) {
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
                cursor: response.featureCount > 0
                    ? "pointer" : "auto",
                pointerEvents: response.featureCount > 0
                    ? "auto" : "none",
            }}
            className="icon-position"
            onClick={() => {
                if (
                    response.featureCount > 0
                ) {
                    setVisible(false);
                    topic.publish("update.point", true);
                    if (selected?.type === "vector") {
                        store.zoomTo(selected);
                    } else if (selected?.type === "raster") {
                        store.zoomToPoint(event.coordinate)
                        const highlightEvent: HighlightEvent = {
                            coordinates: event.coordinate,
                        };
                        topic.publish("feature.highlight", highlightEvent);
                    }
                }
            }}
        >
            <span
                style={{ fontWeight: 500 }}
                title={response.featureCount > 0 ? selected?.type === "vector" ?
                    gettext("Zoom to feature") :
                    gettext("Zoom to raster layer") : undefined}
            >
                <PointClick />
            </span>
        </span>
    )
};