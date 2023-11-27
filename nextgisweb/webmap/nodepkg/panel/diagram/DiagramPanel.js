import { useEffect, useState, useMemo } from "react";
import { Button, Card, Divider } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Line } from "react-chartjs-2";
import { Balancer } from "react-wrap-balancer";

import { Chart, Title, registerables } from 'chart.js';
Chart.register(...registerables);
Chart.register(Title);

import "./DiagramPanel.less";
import { PanelHeader } from "../header";

const title = gettext("Diagrams")
const Build = gettext("Build");
const Rebuild = gettext("Rebuild");
const Delete = gettext("Delete");
const Info = gettext("To select objects, press and hold the CTRL key");

const InfoCard = () => (
    <Card size="small">
        <Balancer >{Info}</Balancer>
    </Card>
);

const LineItem = ({ item }) => {
    let options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                labels: {
                    font: {
                        size: 12
                    },
                    padding: 10,
                },
                position: "top",
                align: 'start',
            },
            legendDistance: {
                padding: 20 // dictates the space
            },
            title: {
                display: true,
                fontSize: 20,
                position: 'top',
                align: 'start',
                padding: {
                    top: 5,
                    bottom: 5
                },
                text: '#ID' + item.props.id + ',  Номер тествого участка: ' + item.props.fields.tu
            },
        },
        animation: false,
        spanGaps: true,
        showLine: false,
    };

    let plugins = [{
        id: 'legendDistance',
        beforeInit(chart, args, opts) {
            const originalFit = chart.legend.fit;
            chart.legend.fit = function fit() {
                originalFit.bind(chart.legend)();
                this.height += opts.padding || 0;
            }
        }
    }]

    return (
        <div className="diagram-content">
            <Line
                type="line"
                options={options}
                plugins={plugins}
                data={item.lineChartData}
            />
        </div>
    )
}

export function DiagramPanel({ value, close, clear }) {

    const [status, setStatus] = useState(value);
    const [data, setData] = useState([]);
    const [result, setResult] = useState([]);
    const [val, setVal] = useState([]);

    const loadData = async (item) => {
        const features = await route("resource.feature_diagram",
            item.column_key,
            item.column_constraint,
            item.fields[item.column_from_const]
        ).get();

        features.sort(function (a, b) {
            return parseFloat(a.fields.date.year) - parseFloat(b.fields.date.year);
        });
        var _labelOsadki = [];
        var _osadki = [];

        var _labelTemperatura = [];
        var _temperatura = [];

        const osadki = features.filter((item) => item.fields.type_id == 2);
        const temperatura = features.filter((item) => item.fields.type_id == 3);

        osadki.map(item => {
            let date = item.fields.date;
            _labelOsadki.push(date.year);
            _osadki.push(item.fields.value);
        });

        temperatura.map(item => {
            let date = item.fields.date;
            _labelTemperatura.push(date.year);
            _temperatura.push(item.fields.value);
        });

        setResult(e => [...e, {
            props: item,
            lineChartData: {
                labels: _labelTemperatura,
                datasets: [
                    {
                        data: _osadki,
                        label: "Осадки",
                        borderColor: "#3E93FF",
                        fill: true,
                        lineTension: 0.5
                    },
                    {
                        data: _temperatura,
                        label: "Температура",
                        borderColor: "#009301",
                        fill: true,
                        lineTension: 0.5
                    },
                ],
            },
        }]);
    };

    useEffect(() => {
        setResult([]);
        data?.map(item => {
            loadData(item);
        })
    }, [data]);

    const reqData = async (item) => {
        const result = await route("request_diagram.data", item.layerId, item.id).get();
        console.log(item);
    };

    useEffect(() => {
        if (val) {
            val?.map(item => {
                reqData(item);
            })
        }
    }, [val]);

    const resultUniqueByKey = [...new Map(result.map(item => [item.props.fields.tu, item])).values()]
    const lineItems = (
        resultUniqueByKey.map(item => {
            return (
                <div key={item.props.id}>
                    <LineItem item={item} />
                    <Divider />
                </div>
            )
        })
    )
    useEffect(() => {
        setStatus(value);
    }, [value]);

    return (
        <div className="ngw-webmap-diagram-panel">
            <PanelHeader {...{ title, close }} />
            <div className="results">
                <div className="request-block">
                    <Button
                        type="primary"
                        onClick={
                            () => {
                                setVal(value);
                            }
                        }
                    >
                        тестовый запрос
                    </Button>
                </div>
                <div className={status ? "diagram-button" : null}>
                    {
                        result.length > 0 ?
                            <div className="diagram-button-old-new">
                                <Button
                                    type="primary"
                                    onClick={
                                        () => {
                                            setData(value);
                                        }
                                    }
                                >
                                    {Rebuild}

                                </Button>
                                <Button
                                    type="primary"
                                    onClick={
                                        () => {
                                            setResult([]);
                                            setData([]);
                                            setStatus(undefined)
                                            clear();
                                        }
                                    }
                                >
                                    {Delete}
                                </Button>
                            </div>
                            :
                            status ?
                                <Button
                                    type="primary"
                                    onClick={
                                        () => {
                                            setData(value);
                                        }
                                    }
                                >
                                    {Build}
                                </Button>
                                : null
                    }
                </div>
                {status ? null : <InfoCard />}
                {lineItems}
            </div>
        </div>
    );
}
