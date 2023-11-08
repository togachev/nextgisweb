import { useEffect, useMemo, useState } from "react";
import { Dropdown, Slider, DatePicker } from "@nextgisweb/gui/antd";
import { HistoryOutlined } from '@ant-design/icons';
import "./TimeLine.less";
import ParseDesc from "./ParseDesc"
import { gettext } from "@nextgisweb/pyramid/i18n";

const msgShowTimeLime = gettext("Show time line");
const msgHideTimeLime = gettext("Hide time line");

const { RangePicker } = DatePicker;

export function TimeLine({
    nodeData,
    timeLineClickId,
    setTimeLineClickId
}) {
    const { id } = nodeData;

    const [value, setValue] = useState({minDate: '', maxDate: ''});
    
    useEffect(() => {
        console.log(value);
    }, [value]);

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
                        min={Math.floor(new Date("2023.10.01").valueOf() / 1000)}
                        max={Math.floor(new Date("2023.10.31").valueOf() / 1000)}
                        defaultValue={[
                            Math.floor(new Date("2023.10.02").valueOf() / 1000),
                            Math.floor(new Date("2023.10.16").valueOf() / 1000)
                        ]}
                        onChange={(item) => {
                            setValue({minDate: item[0], maxDate: item[1]});
                        }}
                    />
                    <RangePicker className="range-picker"
                    onChange={
                        (item) => {
                            let d0 = new Date(item[0].$D, item[0].$M, item[0].$y);
                            let d1 = new Date(item[1].$D, item[1].$M, item[1].$y);
                            setValue({minDate: d0, maxDate: item[1]})
                        }
                    }
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