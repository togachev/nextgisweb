import { useEffect, useState } from "react";
import { Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLine.less";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { parseNgwAttribute } from "../../../feature_layer/nodepkg/util/ngwAttributes.ts";

import moment from 'moment';
import dayjs from "dayjs";

const { RangePicker } = DatePicker;
const msgShowTimeLime = gettext("Show time line");
const msgHideTimeLime = gettext("Hide time line");

const datatype = "DATE"
const dateFormat = 'YYYY-MM-DD';

export function TimeLine({
    nodeData,
    timeLineClickId,
    setTimeLineClickId,
    store
}) {
    const { id, layerId, timeline } = nodeData;

    const [valueStart, setValueStart] = useState(['', '']);
    const [value, setValue] = useState(['', '']);
    const [feature, setFeature] = useState({});
    const [dateType, setDateType] = useState({ layerId: layerId, status: false });
    if (!timeline) {
        return
    }
    const dataTypeCheck = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            setDateType({ layerId: layerId, status: true })
        }
    };

    useEffect(() => {
        dataTypeCheck()
    }, []);

    const startValue = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            const query = { geom: 'no', extensions: 'no', order_by: 'data' }
            const item = await route('feature_layer.feature.collection', layerId).get({ query });
            const date = [item[0].fields.data, item.at(-1).fields.data]
            setValueStart([parseNgwAttribute("DATE", date[0]), parseNgwAttribute("DATE", date[1])]);
        }
    };

    useEffect(() => {
        startValue()
    }, [dateType]);

    const asyncFunc = async () => {
        const fields = await route('resource.item', layerId).get();
        if (fields.feature_layer.fields.find(item => item.datatype === datatype)) {
            const query = { fld_data__ge: moment(value[0]).format(dateFormat), fld_data__le: moment(value[1]).format(dateFormat) }
            const res = await route('feature_layer.feature.collection', layerId).get({ query });
            setFeature(res);
        }
    };

    useEffect(() => {
        if (value[0] !== '' && value[1] !== '') {
            asyncFunc().catch(console.error);
        }
    }, [value]);

    if (timeLineClickId === undefined || timeLineClickId !== id) {
        return (
            <>{
                dateType.status ?
                    <span title={msgShowTimeLime} className="more"
                        onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                        <HistoryOutlined />
                    </span>
                    : null
            }</>
        );
    }

    const onOpenChange = () => {
        setTimeLineClickId(undefined);
    };

    const onChangeRangePicker = (value, dateString) => {
        setValue([dateString[0], dateString[1]]);
    };

    console.log(feature);
    return (
        <Dropdown
            onOpenChange={onOpenChange}
            trigger={["click"]}
            open
            dropdownRender={() => (
                <span onClick={(e) => { e.stopPropagation(); }}>
                    <RangePicker
                        defaultValue={valueStart}
                        onChange={onChangeRangePicker}
                    />
                </span>
            )} >
            <span title={msgHideTimeLime} className="more"
                onClick={(e) => { setTimeLineClickId(id); e.stopPropagation(); }} >
                <HistoryOutlined />
            </span>
        </Dropdown>
    );
}