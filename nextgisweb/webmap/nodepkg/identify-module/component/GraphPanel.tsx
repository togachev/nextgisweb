import { useEffect, useRef, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Empty } from "@nextgisweb/gui/antd";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { LineChartOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { Scatter } from "react-chartjs-2";
import { Chart, Title, registerables } from "chart.js";
Chart.register(...registerables);
Chart.register(Title);

import { context, params } from "../constant";
import type { ContextItemProps } from "../type";

import "./GraphPanel.less";

const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

export const GraphPanel = observer(({ item, store: storeProp }) => {
    const [store] = useState(() => storeProp);
    const {
        hideLegend,
        result,
        setResult,
        fixPos,
        valueRnd,
    } = store;

    const [sizeFont, setSizeFont] = useState(16);

    const chartRef = useRef();
    const imodule = webmapSettings.identify_module;

    const msgGraphs = item ? gettext("Graph") : gettext("Graphs");

    const loadData = async (item) => {
        const { external_resource_id, relation_key, relation_value } = item.relation;
        const key_rel = "fld_" + relation_key;
        const json = {
            [key_rel]: relation_value,
            extensions: "",
            geom: "no",
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

        if (feature.length > 0 && chartRef.current) {
            chartRef.current.destroy();            
        }

        const obj = { props: item, data: { datasets: data } };
        feature.length > 0 ? setResult(obj) : setResult(undefined);
    }

    useEffect(() => {
        loadData(item);
    }, [item]);

    const GraphComponent = ({ value }) => {
        const options = {
            animation: false,
            resizeDelay: 250,
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: 5,
            },
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: sizeFont
                        },
                        padding: 10,
                        usePointStyle: true,
                    },
                    position: "top",
                    align: "start",
                    display: !hideLegend,
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

        const plugin = {
            beforeInit: function (chart) {
                const originalFit = chart.legend.fit
                chart.legend.fit = function fit() {
                    originalFit.bind(chart.legend)()
                    this.height += 20
                }
            }
        }

        const styleResize = fixPos !== null ?
            { width: fixPos.width - 47, height: fixPos.height - 78 } :
            { width: valueRnd.width - 47, height: valueRnd.height - 78 }

        const styleGtaph = !hideLegend ?
            { height: webmapSettings.popup_height } :
            { height: webmapSettings.popup_height * 1.5 };

        return (
            <div className={store && "graph-content"} style={!store ? styleGtaph : null}>
                <Scatter
                    ref={chartRef}
                    type="scatter"
                    options={options}
                    plugins={[plugin]}
                    data={value?.data}
                    style={store ? styleResize : null}
                />
            </div>
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
                        {result ? (<GraphComponent value={result} />) : emptyValue}
                    </div>
                </div>
            </div>
        </div>
    );
});
