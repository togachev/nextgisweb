import { Button, Col, ColorPicker, Form, Row } from "@nextgisweb/gui/antd";
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

const ColorSelectedFeature = observer(({ store }: SettingStore) => {

    const [form] = Form.useForm();

    const onValuesChange = (changedValues: any, values: any) => {
        store.setColorsSelectedFeature(values);
    };

    const clearColor = useCallback((name: string) => {
        form.setFieldsValue({ [name]: defaultValueColor[name] });
        store.setColorsSelectedFeature({
            ...store.colorsSelectedFeature,
            [name]: defaultValueColor[name]
        })
    }, []);

    const formComponent = (
        <Form
            form={form}
            name="ngw_color_feature_highlighter"
            autoComplete="off"
            initialValues={store.colorsSelectedFeature}
            onValuesChange={onValuesChange}
            clearOnDestroy={true}
            className="form-component"
        >
            {getEntries(store.colorsSelectedFeature)?.map(([key, value]) => {
                return (
                    <div key={key} className="color-item">
                        <Row justify="space-between" wrap={false} className={defaultValueColor[key] !== value ? "change-item" : "default-item"}>
                            <Col flex="auto">
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
                                        value={store.colorsSelectedFeature?.[key]}
                                        showText={(color) => <span>{color.toHexString()}</span>}
                                    />
                                </Form.Item>
                            </Col>
                            {defaultValueColor[key] !== value &&
                                <Col flex="none">
                                    <Form.Item noStyle>
                                        <Button type="default" icon={<BackspaceOutline />} title={gettext("Set default value")} onClick={() => clearColor(key)}>{gettext("Set default value")}</Button>
                                    </Form.Item>
                                </Col>
                            }
                        </Row>
                    </div>
                )
            })}
        </Form >
    )

    return formComponent;
});
export default ColorSelectedFeature;