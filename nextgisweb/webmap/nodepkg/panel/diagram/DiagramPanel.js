import { useEffect, useState } from "react";
import { Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Line } from "react-chartjs-2";

import { Chart, Title, registerables } from 'chart.js';
Chart.register(...registerables);
Chart.register(Title);

import "./DiagramPanel.less";
import { PanelHeader } from "../header";

const Create = gettext("Create");
const GraphTitle = gettext("Graph title");
const Clear = gettext("Clear");

export const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
        legend: {
            display: true,
            position: 'top',
        },
        title: {
            display: false,
            text: GraphTitle,
            fontSize: 20,
        },

    },
    animation: false,
    spanGaps: true,
    showLine: false
};


const LineItem = ({ item }) => {
    return (
        <Line
            type="line"
            width={160}
            height={60}
            options={options}
            data={item.lineChartData}
        />
    )
}


export function DiagramPanel({ display, title, close }) {

    const [data, setData] = useState([]);

    const [result, setResult] = useState([]);

    const loadData = async (item) => {

        const features = await route("resource.feature_diagram", item.column_key, item.column_constraint, item.fields[item.column_from_const]).get();

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
            id: item.id,
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

    const lineItems = (
        result.map(item => {
            return (
                <LineItem key={item.id} item={item} />
            )
        })
    )

    return (
        <div className="ngw-webmap-diagram-panel">
            <PanelHeader {...{ title, close }} />
            <div id="diagram-content" className="results">
                <span className="diagram-button">

                    {
                        result.length > 0 ?
                            <Button
                                type="primary"
                                onClick={
                                    () => {
                                        setResult([]);
                                        setData([])
                                    }
                                }
                            >
                                {Clear}
                            </Button>
                            :
                            <Button
                                type="primary"
                                onClick={
                                    () => {
                                        setData(display.identify.uniqueArray);
                                        console.log(display.identify.uniqueArray);
                                    }
                                }
                            >
                                {Create}
                            </Button>
                    }
                </span>
                {lineItems}
            </div>
        </div>
    );
}
