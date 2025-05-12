import { useEffect, useRef, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Empty, Tag } from "@nextgisweb/gui/antd";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import { LineChartOutlined } from "@ant-design/icons";
import { observer } from "mobx-react-lite";
import { Scatter } from "react-chartjs-2";
import { Chart, Title, registerables } from "chart.js";

import EyeOff from "@nextgisweb/icon/mdi/eye-off";
import Eye from "@nextgisweb/icon/mdi/eye";

Chart.register(...registerables);
Chart.register(Title);

import { context, params } from "../constant";
import type { ContextItemProps, DataProps, GraphPanelProps, RelationProps } from "../type";

import "./GraphPanel.less";

type ResultProps = {
    data: {
        datasets: ContextItemProps[]
    };
    props: DataProps;
}

const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

export const GraphPanel = observer((props) => {
    const { item, store: storeProp } = props as GraphPanelProps;
    const sizeFont = 16;
    const [store] = useState(() => storeProp || undefined);
    const [result, setResult] = useState<ResultProps>();
    const [hideLegend, setHideLegend] = useState(true);
    const [resize, setResize] = useState();

    const chartRef = useRef(null);
    const imodule = webmapSettings.imodule;

    const msgGraphs = item ? gettext("Graph") : gettext("Graphs");

    useEffect(() => {
        setResize(store?.fullscreen);
    }, [store?.fullscreen, store?.valueRnd])

    const loadData = async (item: DataProps) => {
        const { external_resource_id, relation_key, relation_value } = item.relation as RelationProps;
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
        Object.keys(context).map(itm => {
            const copy = structuredClone(context[itm]);
            feature.map(i => {
                if (itm === i.fields.type) {
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

    const HideLegend = () => {
        const msgHideLegend = gettext("Hide chart legend");
        const msgShowLegend = gettext("Show chart legend");
        const onChange = (checked: boolean) => {
            setHideLegend(checked);
        };
        return (
            <Tag.CheckableTag
                checked={hideLegend}
                onChange={onChange}
                className="legend-hide-button"
                style={!imodule && !store?.fixPanel ? {} : { position: "absolute", right: 0 }}
            >
                <span title={hideLegend ? msgShowLegend : msgHideLegend}>
                    {hideLegend ? <EyeOff /> : <Eye />}
                </span>
            </Tag.CheckableTag>
        );
    };

    const GraphComponent = ({ value }) => {
        const options = {
            animation: false,
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

        const styleResize = store?.fixPos !== null ?
            { height: store?.fixPos?.height - 76 } :
            { height: store?.valueRnd?.height - 76 }

        const styleGtaph = hideLegend ?
            { height: webmapSettings.popup_size.height } :
            { height: webmapSettings.popup_size.height * 1.5 };

        return (
            <div style={!store ? styleGtaph : undefined}>
                <Scatter
                    ref={chartRef}
                    type="scatter"
                    options={options}
                    plugins={[plugin]}
                    data={value?.data}
                    style={imodule ? resize ? styleResize : styleResize : undefined}
                />
            </div>
        )
    }

    return (
        <>
            {!imodule ?
                <div className="ngw-webmap-panel-section" style={{ color: "var(--primary)" }}>
                    <div className="title">
                        <div className="icon"><LineChartOutlined /></div>
                        <div className="content">{msgGraphs}</div>
                        <div className="suffix">{result && <HideLegend />}</div>
                    </div>
                    <div className="content">
                        {result ? (<GraphComponent value={result} />) : emptyValue}
                    </div>
                </div> :
                <div className="relation-item">
                    {result && store?.fixPanel === "relation" && item?.relation && (<HideLegend />)}
                    {result ? (<GraphComponent value={result} />) : emptyValue}
                </div>
            }
        </>
    );
});
