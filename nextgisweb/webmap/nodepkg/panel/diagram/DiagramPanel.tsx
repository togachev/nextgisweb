import { useEffect, useRef, useState } from "react";
import { Button, Slider } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Scatter } from "react-chartjs-2";
import { Chart, Title, registerables } from "chart.js";

import type { InputNumberProps, SliderSingleProps } from "@nextgisweb/gui/antd";
import type { FeatureItem } from "@nextgisweb/feature-layer/type";
Chart.register(...registerables);
Chart.register(Title);

import "./DiagramPanel.less";
import { PanelHeader } from "../header";

import { useGraph } from "./hook/useGraph";
import { DiagramStore } from "./DiagramStore";
import { observer } from "mobx-react-lite";

import DeleteForever from "@nextgisweb/icon/material/delete_forever/outline";
import ClearIcon from "@nextgisweb/icon/mdi/broom";

const formatter: NonNullable<SliderSingleProps["tooltip"]>["formatter"] = (value) => gettext("Font size") + ` ${value}`;

const title = gettext("Diagrams")
const Delete = gettext("Delete");
const Clear = gettext("Clear");

import type { DiagramProps } from "./type";

type Entries<T> = {
    [K in keyof T]: [K, T[K]];
}[keyof T][];

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
                if (display.panelsManager._activePanelKey && display.panelsManager._activePanelKey === "diagram") {
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
            setSelected({})
            setResult({})
        }
    }, [featInfo]);

    const build = (item: FeatureItem) => {
        features(item).then((i) => {
            const obj = { props: i.props, data: { datasets: i.data } }
            setResult(prev => ({
                ...prev,
                [i.props.id]: obj
            }))
        })
    }

    const clear = (key: string) => {
        const item = { ...result };
        delete item[key];
        setResult({ ...item });
    }

    const remove = (key: string) => {
        clear(key)

        const s = { ...selected };
        delete s[key];
        setSelected({ ...s });

        const f = { ...featInfo };
        delete f[key];
        setFeatInfo({ ...f });
    }

    const onChange: InputNumberProps["onChange"] = (value: number) => {
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
                (Object.entries(selected) as Entries<typeof selected>).map(
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
                (Object.entries(result) as Entries<typeof result>).map(
                    ([, value], i) => {
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