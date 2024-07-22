import { useEffect, useState } from "react";
import { Checkbox } from "@nextgisweb/gui/antd";
import type { CheckboxProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

export const IdentifyOrderEnable = ({ identifyOrderEnabled, onValueChecked }) => {

    const [value, setValue] = useState(identifyOrderEnabled);

    useEffect(() => {
        setValue(identifyOrderEnabled);
    }, [identifyOrderEnabled])

    const onChange: CheckboxProps["onChange"] = (e) => {
        onValueChecked(e.target.checked);
        setValue(e.target.checked);
    };

    const Label = gettext("Enable/disable accounting of the order of layer identification on the map");

    return (<Checkbox checked={value} onChange={onChange}>{Label}</Checkbox>);
};