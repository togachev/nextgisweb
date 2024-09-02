import { useEffect, useRef, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Empty } from "@nextgisweb/gui/antd";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { Tag } from "@nextgisweb/gui/antd";
import { LineChartOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { Scatter } from "react-chartjs-2";
import { Chart, Title, registerables } from "chart.js";
Chart.register(...registerables);
Chart.register(Title);

import { context, params } from "../constant";
import type { ContextItemProps } from "../type";

import "./GraphPanel.less";

const msgHideLegend = gettext("Hide chart legend");
const msgShowLegend = gettext("Show chart legend");
const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

export const GraphPanel = observer(({ item, store: storeProp }) => {

    const [store] = useState(() => storeProp);
    const [result, setResult] = useState(undefined);
    const [sizeFont, setSizeFont] = useState(16);
    const [hideLegend, setHideLegend] = useState(false);

    const chartRef = useRef();
    const imodule = webmapSettings.idetify_module;

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

        const obj = { props: item, data: { datasets: data } };
        feature.length > 0 ? setResult(obj) : setResult(undefined);
    }

    useEffect(() => {
        loadData(item);
    }, [item]);

    useEffect(() => {
        chartRef.current?.resize(store.valueRnd.width - 47, store.valueRnd.height - 110);
    }, [store?.valueRnd]);

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
                    display: hideLegend,
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

        const styleScatter = store?.fixPos !== null ?
            { width: store?.fixPos.width - 47, height: store?.fixPos.height - 110 } :
            { width: store?.valueRnd.width - 47, height: store?.valueRnd.height - 110 }

        const styleGtaph = !hideLegend ?
            { height: webmapSettings.popup_height } :
            { height: webmapSettings.popup_height * 1.5 };
        console.log(webmapSettings);
        
        return (
            <>
                <div className={store && "graph-content"} style={!store ? styleGtaph : null}>
                    <Scatter
                        ref={chartRef}
                        type="scatter"
                        options={options}
                        plugins={[plugin]}
                        data={value?.data}
                        style={store ? styleScatter : null}
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
                    {result && (<HideLegend />)}
                </div>
            </div>
            <div className="panel-content-container">
                <div className="fill">
                    <div className="relation-item">
                        {result ? (<GraphScatter value={result} />) : emptyValue}
                    </div>
                </div>
            </div>
        </div>
    );
});
