import { useEffect, useRef, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { Tag } from "@nextgisweb/gui/antd";
import { LineChartOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";

import { Scatter } from "react-chartjs-2";
import { Chart, Title, registerables } from "chart.js";
Chart.register(...registerables);
Chart.register(Title);

import { context, params } from "./constant";
import type { ContextItemProps } from "./type";

import "./GraphPanel.less";

const msgHideLegend = gettext("Hide chart legend");
const msgShowLegend = gettext("Show chart legend");

export const GraphPanel = observer(({ emptyValue, item, store: storeProp }) => {

    const [store] = useState(() => storeProp);
    const [result, setResult] = useState(undefined);
    const [sizeFont, setSizeFont] = useState(16);
    const [hideLegend, setHideLegend] = useState(false);

    const chartRef = useRef();
    const imodule = webmapSettings.idetify_module;

    const msgGraphs = item ? gettext("Graph") : gettext("Graphs");

    const loadData = async (item, value) => {
        const { external_resource_id, relation_key, relation_value } = item.relation;
        const key_rel = "fld_" + relation_key;
        const json = {
            [key_rel]: relation_value,
            extensions: "",
            geom: "no",
            cache: true,
        }
        const feature = await route("feature_layer.feature.collection", {
            id: external_resource_id,
        }).get({
            query: json,
            cache: true,
        });

        feature.sort(function (a, b) {
            return parseFloat(a.fields.year) - parseFloat(b.fields.year);
        });

        const data: ContextItemProps[] = [];
        Object.keys(context).map(item => {
            const copy: ContextItemProps = structuredClone(context[item]);
            feature.map(i => {
                if (item === i.fields.type) {
                    Object.assign(copy, { key: i.fields.type });
                    Object.assign(copy, params);
                    copy.data.push({ y: i.fields.value, x: i.fields.year });
                    copy.labels.push(i.fields.year);
                }
            })
            data.push(copy)
        })

        const obj = { props: value, data: { datasets: data } };
        feature.length > 0 ? setResult(obj) : setResult(undefined);
    }

    useEffect(() => {
        loadData(item, store.selected);
    }, [store.attribute]);

    useEffect(() => {
        chartRef.current?.resize(store.valueRnd.width - 47, store.valueRnd.height - 110);
    }, [store.valueRnd]);

    const HideLegend = () => {
        const onChange = (checked: boolean) => {
            setHideLegend(checked);
        };
        return (
            <Tag.CheckableTag
                checked={hideLegend}
                onChange={onChange}
                className="legend-hide-button"
            >
                {hideLegend ? msgHideLegend : msgShowLegend}
            </Tag.CheckableTag>
        );
    };

    const GraphScatter = ({ value }) => {
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: sizeFont
                        },
                        padding: 10,
                    },
                    position: "top",
                    align: "start",
                    display: hideLegend,
                },
                legendDistance: {
                    padding: 24,
                },
            },
            tooltips: {
                mode: "index",
                intersect: false,
            },
            hover: {
                mode: "nearest",
                intersect: true
            },
            interaction: {
                mode: "nearest",
                axis: "x",
                intersect: false,
            },
            scales: {
                x: {
                    ticks: {
                        font: {
                            size: sizeFont
                        },
                        color: "#000",

                    },
                    grid: {
                        color: "#000",
                    }
                },
                y: {
                    ticks: {
                        font: {
                            size: sizeFont
                        },
                        color: "#000"
                    },
                    grid: {
                        color: "#000",
                    }
                }
            },
        };

        return (
            <>
                <HideLegend />
                <div className="graph-content" >
                    <Scatter
                        ref={chartRef}
                        type="scatter"
                        options={options}
                        data={value?.data}
                        style={
                            store.fixPos !== null ?
                                { width: store.fixPos.width - 47, height: store.fixPos.height - 110 } :
                                { width: store.valueRnd.width - 47, height: store.valueRnd.height - 110 }
                        }
                    />
                </div>
            </>
        )
    }

    return (
        <div>
            <div className="panel-content-container">
                <div className={imodule ? "right-graph" : "graph"}>
                    {!imodule && (<h3>
                        <LineChartOutlined />
                        {msgGraphs}
                    </h3>)}
                </div>
            </div>
            <div className="panel-content-container">
                <div className="fill">
                    <div className="relation-item">
                        {
                            result ? (<GraphScatter value={result} />) : emptyValue
                        }
                    </div>
                </div>
            </div>
        </div>
    );
});
