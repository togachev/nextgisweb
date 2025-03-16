import { Checkbox, ConfigProvider, useToken } from "@nextgisweb/gui/antd";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type WebmapStore from "../store";
import type { TreeItemConfig } from "../type/TreeItems";
import type { Display } from "@nextgisweb/webmap/display";

import "./Legend.less";

interface LegendProps {
    nodeData: TreeItemConfig;
    store: WebmapStore;
    checkable: boolean;
    display: Display;
}

export function Legend({ nodeData, store, checkable, display  }: LegendProps) {
    const { token } = useToken();

    const legendInfo = "legendInfo" in nodeData && nodeData.legendInfo;
    if (!nodeData || !legendInfo || !legendInfo.open) {
        return <></>;
    }

    const asyncFunc = async (id, name) => {
        // if (name) {
            console.log(name);
            
            const query = name ? { ilike: name } : { not_ilike: "" }
            const getData = async () => {
                const layer_extent = await route("layer.extent", id).get();
                const extent = await route("feature_layer.feature.extent", id).get({ query });

                if (extent.minLon !== null) {
                    return extent
                } else {
                    return layer_extent.extent
                }
            }
            getData()
                .then(extent => {
                    display.map.zoomToNgwExtent(extent, {
                        displayProjection: display.displayProjection,
                    })
                })
                .catch(console.error);
        // }
    };

    const blockClassName = checkable ? "checkable" : "uncheckable";
    return (
        <div className={`legend-block ${blockClassName}`}>
            <ConfigProvider
                theme={{
                    components: {
                        Checkbox: {
                            colorPrimary: token.colorWhite,
                            colorPrimaryHover: token.colorWhite,
                            colorWhite: token.colorPrimary,
                        },
                    },
                }}
            >
                {legendInfo.symbols?.map((s, idx) => {
                    const id = nodeData.id;
                    const layerId = nodeData.layerId;
                    const layerCls = nodeData.layerCls;
                    const symbols = store._legendSymbols[id];
                    const render = (symbols && symbols[s.index]) ?? s.render;
                    const title = s.display_name && s.display_name;
                    let checkbox;
                    if (checkable) {
                        checkbox =
                            s.render !== null ? (
                                <Checkbox
                                    style={{ width: "16px" }}
                                    defaultChecked={render}
                                    onChange={(e) => {
                                        store.setLayerLegendSymbol(
                                            id,
                                            s.index,
                                            e.target.checked
                                        );
                                    }}
                                    onClick={(evt) => evt.stopPropagation()}
                                />
                            ) : (
                                <div style={{ flex: "0 0 16px" }} />
                            );
                    }

                    return (
                        <div
                            key={idx}
                            className="legend-symbol"
                            title={s.display_name}
                            onClick={(e) => {
                                e.stopPropagation();
                                ["vector_layer", "postgis_layer"].includes(layerCls) && asyncFunc(layerId, title);
                            }}
                        >
                            {checkbox}
                            <img
                                width={20}
                                height={20}
                                src={"data:image/png;base64," + s.icon.data}
                            />
                            <div className="legend-title">{s.display_name ? s.display_name : gettext("All other values")}</div>
                        </div>
                    );
                })}
            </ConfigProvider>
        </div>
    );
}