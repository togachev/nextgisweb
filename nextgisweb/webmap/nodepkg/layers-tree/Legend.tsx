import { Checkbox, ConfigProvider, useToken } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type WebmapStore from "../store";
import type { TreeItemConfig } from "../type/TreeItems";
import "./Legend.less";

interface LegendProps {
    nodeData: TreeItemConfig;
    store: WebmapStore;
    checkable: boolean;
}

export function Legend({ nodeData, store, checkable }: LegendProps) {
    const { token } = useToken();

    const legendInfo = "legendInfo" in nodeData && nodeData.legendInfo;
    if (!nodeData || !legendInfo || !legendInfo.open) {
        return <></>;
    }

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
                    const symbols = store._legendSymbols[id];
                    const render = (symbols && symbols[s.index]) ?? s.render;
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
                        >
                            {checkbox}
                            <img
                                width={20}
                                height={20}
                                src={"data:image/png;base64," + s.icon.data}
                            />
                            <span className="legend-title">{s.display_name ? s.display_name : gettext("All other values")}</span>
                        </div>
                    );
                })}
            </ConfigProvider>
        </div>
    );
}