import { theme } from "antd";
import { Checkbox, ConfigProvider } from "@nextgisweb/gui/antd";
import type WebmapStore from "../store";
import type { TreeItem } from "../type/TreeItems";
import type { DisplayMap } from "../type/DisplayMap";
import { route } from "@nextgisweb/pyramid/api";
import "./Legend.less";

interface LegendProps {
    nodeData: TreeItem;
    zoomToNgwExtent: DisplayMap;
    store: WebmapStore;
    checkable: boolean;
}

const { useToken } = theme;

export function Legend({ nodeData, store, checkable, zoomToNgwExtent }: LegendProps) {
    const { token } = useToken();

    const legendInfo = "legendInfo" in nodeData && nodeData.legendInfo;
    if (!nodeData || !legendInfo || !legendInfo.open) {
        return <></>;
    }
    
    const asyncFunc = async (id, name, zoomToNgwExtent) => {
        if (name) {
            const query = { ilike: name }
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
                .then(extent => zoomToNgwExtent(extent))
                .catch(console.error);
        }
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
                {legendInfo.symbols.map((s, idx) => {
                    const id = nodeData.id;
                    const layerId = nodeData.layerId;
                    const layerCls = nodeData.layerCls;
                    const symbols = store._legendSymbols[id];
                    const render = (symbols && symbols[s.index]) ?? s.render;
                    const title = s.display_name ? s.display_name : nodeData.title;
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
                            onClick={() => ["vector_layer", "postgis_layer"].includes(layerCls) && asyncFunc(layerId, title, zoomToNgwExtent)}
                        >
                            {checkbox}
                            <img
                                className="icon-list"
                                width={20}
                                height={20}
                                src={"data:image/png;base64," + s.icon.data}
                            />
                            <span className="titleName">{title}</span>
                        </div>
                    );
                })}
            </ConfigProvider>
        </div>
    );
}
