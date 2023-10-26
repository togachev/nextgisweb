import { useEffect, useState, useMemo, useRef } from "react";
import parse, { Element, domToReact } from 'html-react-parser';
import { CloseButton } from "../header/CloseButton";
import { Button } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { route } from "@nextgisweb/pyramid/api";
import { Line } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import "./DiagramPanel.less";

const Create = gettext("Create");
import { PanelHeader } from "../header";

const LineItem = ({ item }) => {
    return (
        <Line
            type="line"
            width={160}
            height={60}
            options={{
                title: {
                    display: true,
                    text: "Заголовок почему-то не работает....",
                    fontSize: 20
                },
                legend: {
                    display: true, //Is the legend shown?
                    position: "top" //Position of the legend.
                }
            }}
            data={item.lineChartData}
        />
    )
}

export function DiagramPanel(props) {

    
    useEffect(() => {
        console.log(props);
    }, [props]);
    // const seen = new Set();

    // const arrayData = value?.filter(item => {
    //     let duplicate = seen.has(item.id);
    //     seen.add(item.id);
    //     return !duplicate;
    // });

    // const [start, setStart] = useState(false);
    // const [result, setResult] = useState([]);

    // const loadData = async (item) => {

    //     const features = await route("resource.feature_diagram", item.column_key, item.column_constraint, item.fields[item.column_from_const]).get();

    //     features.sort(function (a, b) {
    //         return parseFloat(a.fields.date.year) - parseFloat(b.fields.date.year);
    //     });
    //     var _labelOsadki = [];
    //     var _osadki = [];

    //     var _labelTemperatura = [];
    //     var _temperatura = [];

    //     const osadki = features.filter((item) => item.fields.type_id == 2);
    //     const temperatura = features.filter((item) => item.fields.type_id == 3);

    //     osadki.map(item => {
    //         let date = item.fields.date;
    //         _labelOsadki.push(date.year);
    //         _osadki.push(item.fields.value);
    //     });

    //     temperatura.map(item => {
    //         let date = item.fields.date;
    //         _labelTemperatura.push(date.year);
    //         _temperatura.push(item.fields.value);
    //     });

    //     setResult(e => [...e, {
    //         id: item.id,
    //         lineChartData: {
    //             labels: _labelTemperatura,
    //             datasets: [
    //                 {
    //                     data: _osadki,
    //                     label: "Осадки",
    //                     borderColor: "#3E93FF",
    //                     fill: true,
    //                     lineTension: 0.5
    //                 },
    //                 {
    //                     data: _temperatura,
    //                     label: "Температура",
    //                     borderColor: "#009301",
    //                     fill: true,
    //                     lineTension: 0.5
    //                 },
    //             ]
    //         }
    //     }]);
    // };

    // console.log(arrayData);

    // useMemo(() => {

    //     arrayData?.map(item => {
    //         loadData(item);
    //     })
    // }, [start]);

    let diagramResult = null;
    // if (arrayData?.length > 0) {
    //     diagramResult =
    //         <div><Button
    //             type="primary"
    //             onClick={
    //                 () => {
    //                     setStart(true)
    //                 }
    //             }
    //         >
    //             {Create}
    //         </Button>
    //             <span>Выбрано объектов: {arrayData.length}</span>
    //         </div>
    // }

    return (
        <>
            <div className="ngw-webmap-diagram-panel">
                {/* <PanelHeader {...{ title, close }} /> */}
                <div className="results">
                    {diagramResult}
                </div>
            </div>
        </>
    );
}
