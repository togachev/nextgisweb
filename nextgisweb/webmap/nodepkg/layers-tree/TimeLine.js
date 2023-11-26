import { useEffect, useMemo, useState } from "react";
import { Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLine.less";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
const { RangePicker } = DatePicker;
import { errorModal } from "@nextgisweb/gui/error";
const msgShowTimeLime = gettext("Show time line");
const msgHideTimeLime = gettext("Hide time line");

export function TimeLine({
    nodeData,
    timeLineClickId,
    setTimeLineClickId,
    store
}) {
    const { id, layerId } = nodeData;
    const [valueStart, setValueStart] = useState({minDate: '', maxDate: ''});
    const [value, setValue] = useState({minDate: '', maxDate: ''});
    const [feature, setFeature] = useState({});

    useEffect(() => {
        let isSubscribed = true;
        const asyncFuncValue = async () => {
            const query = { geom: 'no', extensions: 'no', order_by: 'data' }
            const item = await route('feature_layer.feature.collection', layerId).get({ query });
            if (isSubscribed) {
                setValueStart({minDate: item[0].fields.data.year + '.' + item[0].fields.data.month + '.' + item[0].fields.data.day, maxDate: item.at(-1).fields.data.year + '.' + item.at(-1).fields.data.month + '.' + item.at(-1).fields.data.day});
            }
        };
        asyncFuncValue().catch(console.error);
        return () => isSubscribed = false;
    }, []);


    useEffect(() => {
        let isSubscribed = false;
        const asyncFunc = async () => {
            const query = { fld_data__ge: value.minDate, fld_data__le: value.maxDate }
            const res = await route('feature_layer.feature.collection', layerId).get({ query });
            if (isSubscribed) {
                setFeature(res);
            };
        };
        if(value.minDate !== '' && value.maxDate !== ''){
            asyncFunc().catch(console.error);
        }
        return () => isSubscribed = true;
    }, [value]);
    console.log(feature);

    if (timeLineClickId === undefined || timeLineClickId !== id) {
        return (
            <span title={msgShowTimeLime} className="more"
                onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                <HistoryOutlined />
            </span>
        );
    }

    const onOpenChange = () => {
        setTimeLineClickId(undefined);
    };
    
    return (
        <Dropdown
            onOpenChange={onOpenChange}
            trigger={["click"]}
            open
            dropdownRender={() => (
                <span className="timeline-content" onClick={(e) => { e.stopPropagation(); }}>
                    <Slider
                        range={{
                            draggableTrack: true
                        }}
                        min={Math.floor(new Date(valueStart.minDate).valueOf())}
                        max={Math.floor(new Date(valueStart.maxDate).valueOf())}
                        defaultValue={[
                            Math.floor(new Date(valueStart.minDate).valueOf()),
                            Math.floor(new Date(valueStart.maxDate).valueOf())
                        ]}
                        onChange={(item) => {

                            var yyyy = [ new Date( item[0]).getFullYear().toString(), new Date( item[1]).getFullYear().toString() ];
                            var mm = [ (new Date( item[0]).getMonth()+1).toString(), (new Date( item[1]).getMonth()+1).toString() ];
                            var dd  = [ new Date( item[0]).getDate().toString(), new Date( item[1]).getDate().toString() ];

                            let mmChars = [ mm[0].split(''), mm[1].split('') ];
                            let ddChars = [ dd[0].split(''), dd[1].split('')];

                            setValue({minDate: yyyy[0] + '.' + (mmChars[0][1]?mm[0]:"0"+mmChars[0][0]) + '.' + (ddChars[0][1]?dd[0]:"0"+ddChars[0][0]), maxDate: yyyy[1] + '.' + (mmChars[1][1]?mm[1]:"0"+mmChars[1][0]) + '.' + (ddChars[1][1]?dd[1]:"0"+ddChars[1][0])});
                        }}
                    />
                    {/* <RangePicker className="range-picker"
                    onChange={(item) => {

                            var yyyy = [ new Date( item[0]).getFullYear().toString(), new Date( item[1]).getFullYear().toString() ];
                            var mm = [ (new Date( item[0]).getMonth()+1).toString(), (new Date( item[1]).getMonth()+1).toString() ];
                            var dd  = [ new Date( item[0]).getDate().toString(), new Date( item[1]).getDate().toString() ];

                            let mmChars = [ mm[0].split(''), mm[1].split('') ];
                            let ddChars = [ dd[0].split(''), dd[1].split('')];

                            setValue({minDate: yyyy[0] + '.' + (mmChars[0][1]?mm[0]:"0"+mmChars[0][0]) + '.' + (ddChars[0][1]?dd[0]:"0"+ddChars[0][0]), maxDate: yyyy[1] + '.' + (mmChars[1][1]?mm[1]:"0"+mmChars[1][0]) + '.' + (ddChars[1][1]?dd[1]:"0"+ddChars[1][0])});
                        }}
                    /> */}
                </span>
            )} >
            <span title={msgHideTimeLime} className="more"
                onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                <HistoryOutlined />
            </span>
        </Dropdown>
    );
}