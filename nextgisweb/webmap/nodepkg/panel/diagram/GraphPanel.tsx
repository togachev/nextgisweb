import { useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";

import { Button } from "@nextgisweb/gui/antd";
import { LineChartOutlined } from "@ant-design/icons";

import ScatterPlot from "@nextgisweb/icon/material/scatter_plot/outline";
import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";

import "./GraphPanel.less";

export const GraphPanel = ({ item }) => {
    const [result, setResult] = useState(undefined);

    const status = result && Object.keys(result).includes(item.id.toString());

    const msgGraphs = item ? gettext("Graph") : gettext("Graphs");

    const loadData = async (item) => {
        const { external_resource_id, relation_key, relation_value } = item.relation;
        const key_rel = "fld_" + relation_key;
        const json = {
            [key_rel]: relation_value,
            extensions: "",
            geom: "no",
            cache: true,
        }
        const data = await route("feature_layer.feature.collection", {
            id: external_resource_id,
        }).get({
            query: json,
            cache: true,
        });

        setResult(prev => ({
            ...prev,
            [item.id]: data.length > 0 ? data : gettext("No data")
        }))
    }

    return (
        <>
            <div className="panel-content-container">
                <div className="graph">
                    <h3>
                        <LineChartOutlined />
                        {msgGraphs}
                    </h3>
                    <div className="button-graph">
                        {status ?
                            (<Button
                                title={gettext("Delete graph")}
                                type="text"
                                icon={<DeleteForever />}
                                onClick={() => {
                                    const newItems = { ...result };
                                    delete newItems[item.id];
                                    setResult(newItems);
                                }}
                                danger
                            />) :
                            (<Button
                                title={gettext("Build graph")}
                                type="text"
                                icon={<ScatterPlot />}
                                onClick={() => loadData(item)}
                            />)
                        }
                    </div>
                </div>
            </div>
            <div className="panel-content-container">
                <div className="fill">
                    <div className="relation-item">
                        <span style={{ textWrap: "balance", maxHeight: "250px", overflow: "overlay" }}>{result && JSON.stringify(result[item.id])}</span>
                    </div>
                </div>
            </div>
        </>
    );
};
