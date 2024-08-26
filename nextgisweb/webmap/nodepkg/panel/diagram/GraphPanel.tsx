import { useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";

import { Button, List, ConfigProvider } from "@nextgisweb/gui/antd";
import { LineChartOutlined } from "@ant-design/icons";

import ScatterPlot from "@nextgisweb/icon/material/scatter_plot/outline";

import "./GraphPanel.less";

export const GraphPanel = ({ relations }) => {

    const [result, setResult] = useState(undefined);

    const msgGraphs = relations?.length === 1 ? gettext("Graph") : gettext("Graphs");

    const loadData = async (item) => {
        const { external_resource_id, relation_key, relation_value } = item.relation;
        const key_rel = "fld_" + relation_key;
        const query = {
            [key_rel]: relation_value,
            extensions: "",
            geom: "no",
        }
        const data = await route("feature_layer.feature.collection", {
            id: external_resource_id,
        }).get({ query });

        setResult(prev => ({
            ...prev,
            [item.id]: data.length > 0 ? data : gettext("No data")
        }))
    }

    return (
        <ConfigProvider
            theme={{
                components: {
                    List: {
                        itemPaddingSM: "5px 0",
                        paddingXS: 4,
                        paddingSM: 4,
                    },
                },
            }}
        >
            <div className="panel-content-container">
                <div className="fill">
                    <h3>
                        <LineChartOutlined />
                        {msgGraphs}
                    </h3>
                </div>
            </div>
            <div className="panel-content-container">
                <div className="fill">
                    <List
                        size="small"
                        bordered={false}
                        dataSource={relations}
                        renderItem={(item) => {
                            return (
                                <List.Item>
                                    <div className="relation-item">
                                        <Button
                                            size="small"
                                            className="build-graph"
                                            icon={<ScatterPlot />}
                                            onClick={() => loadData(item)}
                                        >
                                            {gettext("Build graph")}
                                        </Button>
                                        <span style={{ textWrap: "balance", maxHeight: "250px", overflow: "overlay" }}>{result && JSON.stringify(result[item.id])}</span>
                                    </div>
                                </List.Item>
                            )
                        }}
                    />
                </div>
            </div>
        </ConfigProvider >
    );
};
