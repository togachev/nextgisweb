import { useEffect, useRef, useState } from "react";
import { Button, Slider } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Scatter } from "react-chartjs-2";
import { Chart, Title, registerables } from "chart.js";

import type { InputNumberProps, SliderSingleProps } from "@nextgisweb/gui/antd";
import type { DojoDisplay } from "@nextgisweb/webmap/type";
import type { DojoTopic } from "@nextgisweb/webmap/panels-manager/type";
Chart.register(...registerables);
Chart.register(Title);

import "./DiagramPanel.less";
import { PanelHeader } from "../header";

import { useGraph } from "./hook/useGraph";
import { DiagramStore } from "./DiagramStore";
import { observer } from "mobx-react-lite";

import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ClearIcon from "@nextgisweb/icon/mdi/broom";

const formatter: NonNullable<SliderSingleProps['tooltip']>['formatter'] = (value) => gettext("Font size") + ` ${value}`;

const title = gettext("Diagrams")
const Delete = gettext("Delete");
const Clear = gettext("Clear");

interface DiagramProps {
    display: DojoDisplay;
    topic: DojoTopic;
    close: () => void;
}

export const DiagramPanel = observer(({ display, close, topic }: DiagramProps) => {
    const { checkSelect, displayFeatureInfo, features, featInfo, olmap, setFeatInfo } = useGraph({ display, topic });
    const chartRef = useRef();
    const [store] = useState(() => new DiagramStore({}));
    const [sizeFont, setSizeFont] = useState(16)
    const {
        selected,
        setSelected,
        result,
        setResult,
    } = store;

    useEffect(() => {
        olmap.on("click", (e) => {
            if (e.dragging) return;
            if (e.originalEvent.ctrlKey === true) {
                if (display.panelsManager._activePanelKey && display.panelsManager._activePanelKey == "diagram") {
                    displayFeatureInfo(e.pixel)
                }
            }
        });
    }, [])

    useEffect(() => {
        if (Object.keys(featInfo).length > 0) {
            setSelected(prev => ({
                ...prev,
                ...featInfo
            }))
        }
        else {
            console.log(Object.keys(featInfo).length);
            setSelected({})
            setResult({})
        }
    }, [featInfo]);


    let plugins = [{
        id: "legendDistance",
        beforeInit(chart, args, opts) {
            const originalFit = chart.legend.fit;
            chart.legend.fit = function fit() {
                originalFit.bind(chart.legend)();
                this.height += opts.padding || 0;
            }
        }
    }]

    const build = (item) => {
        features(item).then((i) => {
            const obj = { props: i.props, data: { datasets: i.data } }
            setResult(prev => ({
                ...prev,
                [i.props.id]: obj
            }))
        })
    }

    const clear = (key) => {
        const { [key]: tmp, ...rest } = result;
        setResult(rest);
    }

    const remove = (key) => {
        const { [key]: _r, ...r } = result;
        setResult(r);
        const { [key]: _s, ...s } = selected;
        setSelected(s);
        const { [key]: _f, ...f } = featInfo;
        setFeatInfo(f);
    }
    const onChange: InputNumberProps["onChange"] = (value) => {
        setSizeFont(value)
    };

    return (
        <div className="ngw-webmap-diagram-panel" >
            <PanelHeader {...{ title, close }} />
            {Object.keys(selected).length > 0 && (
                /*Slider to change font size*/
                <Slider min={12} max={48} tooltip={{ formatter }} defaultValue={sizeFont} onChange={onChange} />
            )}
            {
                Object.keys(selected).length > 0 &&
                Object.entries(selected).map(
                    ([key, value], i) => {
                        return (
                            <div key={i} className="item-graph">
                                <Button
                                    size="small"
                                    onClick={() => build(value)}
                                >
                                    {value?.fields?.name}
                                </Button>
                                <div className="item-control">
                                    {result[key] ? <div
                                        title={Clear}
                                        className="icon-symbol"
                                        onClick={() => clear(key)}
                                    >
                                        <ClearIcon />
                                    </div> : null}
                                    <div
                                        title={Delete}
                                        className="icon-symbol"
                                        onClick={() => {
                                            remove(key);
                                            checkSelect(value, true);
                                        }}
                                    >
                                        <DeleteForever />
                                    </div>
                                </div>
                            </div>
                        )
                    }
                )
            }
            {
                result && Object.keys(result).length > 0 &&
                Object.entries(result).map(
                    ([key, value], i) => {
                        let options = {
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
                                },
                                legendDistance: {
                                    padding: 24,
                                },
                                title: {
                                    display: true,
                                    font: {
                                        size: sizeFont
                                    },
                                    position: "top",
                                    align: "start",
                                    padding: {
                                        top: 5,
                                        bottom: 5,
                                    },
                                    text: "Территория: " + value?.props.fields.name,
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
                            <div key={i} className="diagram-content">
                                <Scatter
                                    ref={chartRef}
                                    type="scatter"
                                    options={options}
                                    plugins={plugins}
                                    data={value?.data}
                                />
                            </div>
                        )
                    }
                )
            }
        </div>
    );
});