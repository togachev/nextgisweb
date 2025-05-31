import { useState, useEffect } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { PointClick } from "@nextgisweb/webmap/icon";
import topic from "@nextgisweb/webmap/compat/topic";

import type { Params, Props } from "../type";

export default function PointClickComponent({ display, event, params, countFeature }: Params) {
    const { response, selected: value } = params as Props;
    const selectVal = value ? value : response.data[0];

    const [selected, setSelected] = useState<object>(value);
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

    const zoomTo = () => {
        if (!selected) return;
        setTimeout(() => {
            display.featureHighlighter
                .highlightFeatureById(selected.id, selected.layerId)
                .then((feature) => {
                    display.map.zoomToFeature(feature);
                    topic.publish("update.point");
                });
        }, 250);
    };

    const zoomToRasterExtent = async () => {
        const { extent } = await route("layer.extent", {
            id: selected.styleId,
        }).get({ cache: true });
        setTimeout(() => {
            display.map.zoomToNgwExtent(extent, {
                displayProjection: display.displayProjection,
            });
            topic.publish("update.point");
        }, 250);
    };

    return (
        <span
            title={selected?.type === "vector" ? gettext("Zoom to feature") : gettext("Zoom to raster layer")}
            style={{
                display: visible ? "block" : "none",
                cursor: countFeature > 0 && "pointer",
            }}
            className="icon-position"
            onClick={() => {
                if (countFeature > 0) {
                    selected?.type === "vector" ? zoomTo() :
                        selected?.type === "raster" ? zoomToRasterExtent() :
                            undefined
                    setVisible(false);
                }
            }}>
            <PointClick />
        </span>
    )
};