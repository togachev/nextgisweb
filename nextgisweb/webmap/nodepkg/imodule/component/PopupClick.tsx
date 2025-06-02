import { useState, useEffect } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { PointClick } from "@nextgisweb/webmap/icon";
import topic from "@nextgisweb/webmap/compat/topic";
import { ConfigProvider, Tooltip } from "@nextgisweb/gui/antd";

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
            id: selected?.styleId,
        }).get({ cache: true });
        setTimeout(() => {
            display.map.zoomToNgwExtent(extent, {
                displayProjection: display.displayProjection,
            });
            topic.publish("update.point");
        }, 250);
    };

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tooltip: {
                        borderRadius: 2,
                        lineHeight: 1,
                        fontSize: 12,
                        controlHeight: 22,
                        colorBgSpotlight: "rgb(255 255 255 / 80%)",
                        colorTextLightSolid: "--text-base",
                    },
                },
            }}>
            <span

                style={{
                    display: visible ? "block" : "none",
                    cursor: countFeature > 0 ? "pointer" : "auto",
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
                <Tooltip
                    overlayInnerStyle={{ pointerEvents: "none", fontWeight: 500 }}
                    title={selected?.type === "vector" ?
                        gettext("Zoom to feature") :
                        gettext("Zoom to raster layer")}>
                    <PointClick />
                </Tooltip>
            </span>
        </ConfigProvider>
    )
};