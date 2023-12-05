import { useEffect, useState } from "react";
import { Button, Card, Divider, InputNumber } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Line } from "react-chartjs-2";
import { Balancer } from "react-wrap-balancer";
import { v4 as uuidv4 } from 'uuid';
import { Chart, Title, registerables } from 'chart.js';

Chart.register(...registerables);
Chart.register(Title);

import "./DiagramPanel.less";
import { PanelHeader } from "../header";

const title = gettext("Diagrams")
const Build = gettext("Build");
const Rebuild = gettext("Rebuild");
const Delete = gettext("Delete");
const InfoForecast = gettext("The calculation is performed for the last selected object");
const Info = gettext("To select objects, press and hold the CTRL key");
const Forecasting = gettext("Forecasting");
const Recovery = gettext("Recovery");
const CountOfTrajectories = gettext("Count of trajectories");
const PredictionAndRecovery = gettext("Prediction and recovery");
const StaticData = gettext("Graphs based on static data");

const InfoCard = () => (
    <Card size="small">
        <Balancer >{Info}</Balancer>
    </Card>
);

const InfoCardForecast = () => (
    <Card size="small">
        <Balancer >{InfoForecast}</Balancer>
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

    const [selected, setSelected] = useState(value);
    const [data, setData] = useState([]);
    const [result, setResult] = useState([]);
    const [countTraectoriesReq, setCountTraectoriesReq] = useState(1500)
    const [countTraectoriesCalc, setCountTraectoriesCalc] = useState(1000)

    const resultData = async (item) => {
        const features = await route("resource.feature_diagram",
            item.column_key,
            item.column_constraint,
            item.fields[item.column_from_const]
        ).get();
        features.sort(function (a, b) {
            return parseFloat(a.fields.date.year) - parseFloat(b.fields.date.year);
        });

        var _labelSquare = [];
        var _square = [];

        var _labelPrecipitation = [];
        var _precipitation = [];

        var _labelTemperature = [];
        var _temperature = [];

        const square_ = features.filter((item) => item.fields.type_id == 1);
        const precipitation_ = features.filter((item) => item.fields.type_id == 2);
        const temperature_ = features.filter((item) => item.fields.type_id == 3);

        square_.map(item => {
            let date = item.fields.date;
            _labelSquare.push(date.year);
            _square.push(item.fields.value);
        });

        precipitation_.map(item => {
            let date = item.fields.date;
            _labelPrecipitation.push(date.year);
            _precipitation.push(item.fields.value);
        });

        temperature_.map(item => {
            let date = item.fields.date;
            _labelTemperature.push(date.year);
            _temperature.push(item.fields.value);
        });

        setResult(e => [...e, {
            props: item,
            lineChartData: {
                labels: _labelTemperature,
                datasets: [
                    {
                        data: _square,
                        label: "Площадь",
                        borderColor: "#FF0060",
                        fill: true,
                        lineTension: 0.5
                    },
                    {
                        data: _precipitation,
                        label: "Атмосферные осадки",
                        borderColor: "#3E93FF",
                        fill: true,
                        lineTension: 0.5
                    },
                    {
                        data: _temperature,
                        label: "Температура",
                        borderColor: "#009301",
                        fill: true,
                        lineTension: 0.5
                    },
                ],
            },
        }]);
    };

    const forecastData = async (type) => {
        if (selected.length === 0) {
            return;
        }
        const item = selected.at(-1)

        const features = await route("resource.feature_diagram",
            item.column_key,
            item.column_constraint,
            item.fields[item.column_from_const]
        ).get();

        features.sort(function (a, b) {
            return parseFloat(a.fields.date.year) - parseFloat(b.fields.date.year);
        });

        const square_ = features.filter((item) => item.fields.type_id == 1);
        const precipitation_ = features.filter((item) => item.fields.type_id == 2);
        const temperature_ = features.filter((item) => item.fields.type_id == 3);

        const temperature = Object.fromEntries(
            temperature_.map((item, i) => [item.fields.date.year, item.fields.value])
        )

        const precipitation = Object.fromEntries(
            precipitation_.map((item, i) => [item.fields.date.year, item.fields.value])
        )

        const square = Object.fromEntries(
            square_.map((item, i) => [item.fields.date.year, item.fields.value])
        )
        if (type === 'req') {
            let query = {
                id: uuidv4(),
                main_param_name: "square",
                count_of_trajectories: countTraectoriesReq,
                type: "randomize_modeling",
                data: {
                    temperature,
                    precipitation,
                    square,
                },
            }

            console.log(JSON.stringify(query));

            // return fetch('http://192.168.14.171:8080/v1/recovery', {
            //     method: 'POST',
            //     body: JSON.stringify(query),
            //     mode: 'no-cors',
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            // }).then((response) => response.json())
            //     .then((result) => {
            //         console.log(result);
            //         return result;
            //     })

        }
        if (type === 'calc') {
            let query = {
                id: uuidv4(),
                main_param_name: "square",
                count_of_trajectories: countTraectoriesCalc,
                type: "randomize_modeling",
                data: {
                    temperature: temperature,
                    precipitation: temperature,
                    square: square,
                },
                period_type: "short",
            }

            console.log(JSON.stringify(query));

            // return fetch('http://192.168.14.171:8080/v1/forecast', {
            //     method: 'POST',
            //     body: JSON.stringify(query),
            //     mode: 'no-cors',
            //     headers: {
            //         "Content-Type": "application/json",
            //     },
            // }).then((response) => console.log(response))

        }
    };

    const onChangeCountReq = (values) => {
        setCountTraectoriesReq(values);
    };

    const onChangeCountCalc = (values) => {
        setCountTraectoriesCalc(values);
    };

    useEffect(() => {
        setResult([]);
        data?.map(item => {
            resultData(item);
        })
    }, [data]);

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
        setSelected(value);
    }, [value]);

    return (
        <div className="ngw-webmap-diagram-panel">
            <PanelHeader {...{ title, close }} />
            <div className="results">
                <Divider>{PredictionAndRecovery}</Divider>
                <div className={selected ? "diagram-button" : null}>
                    {
                        selected ?
                            <div className="request-block-list">
                                <div className="request-block">
                                    <Button
                                        type="primary"
                                        onClick={() => {
                                            forecastData('req')
                                        }}
                                    >
                                        {Recovery}
                                    </Button>
                                    <div className="float-input-label">
                                        <label className="float">{CountOfTrajectories}</label>
                                        <InputNumber style={{ width: '100%' }}
                                            defaultValue={countTraectoriesReq}
                                            onChange={onChangeCountReq} />
                                    </div>
                                </div>
                                <div className="request-block">
                                    <Button
                                        type="primary"
                                        onClick={() => forecastData('calc')}
                                    >
                                        {Forecasting}
                                    </Button>
                                    <div className="float-input-label">
                                        <label className="float">{CountOfTrajectories}</label>
                                        <InputNumber style={{ width: '100%' }} min={1000} max={100000}
                                            defaultValue={countTraectoriesCalc}
                                            onChange={onChangeCountCalc} />
                                    </div>
                                </div>
                            </div>

                            : <InfoCardForecast />
                    }
                </div>
                <Divider>{StaticData}</Divider>
                <div className={selected ? "diagram-button" : null}>
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
                                            setSelected(undefined)
                                            clear();
                                        }
                                    }
                                >
                                    {Delete}
                                </Button>
                            </div>
                            :
                            selected ?
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
                {selected ? null : <InfoCard />}
                {lineItems}
            </div>
        </div>
    );
}
