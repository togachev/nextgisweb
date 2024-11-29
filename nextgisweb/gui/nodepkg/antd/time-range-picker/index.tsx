import type { TimeRangePickerProps } from "antd";
import dayjs from "dayjs";
import type { PickerRef } from "rc-picker";
import { forwardRef } from "react";

import RangePicker from "../range-date-time-picker";

const TimeRangePicker = forwardRef<PickerRef, TimeRangePickerProps>((props, ref) => {
    const localizedTime = dayjs.localeData().longDateFormat("LTS");
    return (
        <RangePicker
            {...props}
            picker="time"
            mode={undefined}
            ref={ref}
            format={localizedTime}
        />
    );
});

TimeRangePicker.displayName = "TimeRangePicker";

export default TimeRangePicker;
