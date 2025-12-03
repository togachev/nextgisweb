import { Button, ColorPicker, Form } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { getEntries } from "@nextgisweb/webmap/popup/util/function";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";

import BackspaceOutline from "@nextgisweb/icon/mdi/backspace-outline";

import type { ColorSF, SettingStore } from "@nextgisweb/webmap/settings-widget/SettingStore";

import "./ColorSelectedFeature.less";

const defaultValueColor: ColorSF = {
    stroke_primary: "rgba(255,255,0,1)",
    stroke_secondary: "rgba(0, 0, 0, 1)",
    fill: "rgba(255,255,255,0.1)",
}

interface ControlProps {
    label: string;
}

const colorProps: { [key: string]: ControlProps } = {
    fill: { label: gettext("Color fill") },
    stroke_primary: { label: gettext("Stroke primary") },
    stroke_secondary: { label: gettext("Stroke secondary") },
};

const ColorSelectedFeature = observer(({ store }: SettingStore) => {

    const [form] = Form.useForm();

    const onValuesChange = (changedValues: any, values: any) => {
        store.setColorSF(values);
    };

    const clearColor = useCallback((name: string) => {
        form.setFieldsValue({ [name]: defaultValueColor[name] });
        store.setColorSF({
            ...store.colorSF,
            [name]: defaultValueColor[name]
        })
    }, []);

    const formComponent = (
        <Form
            form={form}
            name="ngw_color_feature_highlighter"
            autoComplete="off"
            initialValues={store.colorSF}
            onValuesChange={onValuesChange}
            clearOnDestroy={true}
            className="form-component"
        >
            <div className="color-item">
                {getEntries(store.colorSF)?.map(([key, value]) => {
                    return (
                        <div key={key} className="change-item">
                            <div className="item-label">{colorProps[key].label}</div>
                            <Form.Item
                                noStyle
                                name={key}
                                getValueFromEvent={(color) => {
                                    return "#" + color.toHex();
                                }}
                            >
                                <ColorPicker
                                    className="color-picker-item"
                                    allowClear={true}
                                    value={store.colorSF?.[key]}
                                    showText={(color) => <span>{color.toHexString()}</span>}
                                />
                            </Form.Item>
                            {defaultValueColor[key] !== value &&
                                <Form.Item noStyle>
                                    <Button type="text" icon={<BackspaceOutline />} title={gettext("Set default value")} onClick={() => clearColor(key)} />
                                </Form.Item>
                            }
                        </div>
                    )
                })}
            </div>
        </Form >
    )

    return formComponent;
});
export default ColorSelectedFeature;