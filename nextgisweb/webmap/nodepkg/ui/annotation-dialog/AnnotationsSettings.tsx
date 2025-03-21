import type { Type as GeometryType } from "ol/geom/Geometry";

import { Col, ColorPicker, Form, InputNumber, Row } from "@nextgisweb/gui/antd";
import { presetColors } from "@nextgisweb/gui/util/constant/presetColors";
import { gettext } from "@nextgisweb/pyramid/i18n";

export interface AnnotationSettings {
    widthStroke: number;
    colorStroke: string;
    fillStroke: string;
    circleSize: number;
}

interface AnnotationsSettingsProps {
    value: AnnotationSettings;
    geometryType: GeometryType | undefined;
    onChange: (value: AnnotationsSettingsProps["value"]) => void;
}

const customStyleFormItem = { marginBottom: "5px" };

export function AnnotationsSettings({
    value,
    geometryType,
    onChange,
}: AnnotationsSettingsProps) {
    const handleChange = <K extends keyof AnnotationSettings>(
        key: K,
        newValue: AnnotationSettings[K]
    ) => {
        onChange({
            ...value,
            [key]: newValue,
        });
    };

    const handleColorChange = (
        e: string,
        key: "colorStroke" | "fillStroke"
    ) => {
        handleChange(key, e);
    };

    const showStrokeFormItem = ["Point", "Polygon", "Line"].some((type) =>
        geometryType?.includes(type)
    );
    const showFillFormItem = ["Point", "Polygon"].some((type) =>
        geometryType?.includes(type)
    );
    const showCircleSizeFormItem = ["Point"].some((type) =>
        geometryType?.includes(type)
    );

    return (
        <Form layout="horizontal" size="small" className="annotations-settings">
            {showStrokeFormItem && (
                <Form.Item
                    style={customStyleFormItem}
                    label={gettext("Stroke: width / color")}
                >
                    <Row gutter={16}>
                        <Col>
                            <InputNumber
                                min={0}
                                max={20}
                                precision={0}
                                value={value.widthStroke}
                                onChange={(newValue) => {
                                    handleChange("widthStroke", newValue ?? 1);
                                }}
                            />
                        </Col>
                        <Col>
                            <ColorPicker
                                presets={[
                                    {
                                        label: gettext("Colors"),
                                        colors: presetColors,
                                    },
                                ]}
                                value={value.colorStroke}
                                onChange={(e) => {
                                    handleColorChange(
                                        e.toHexString(),
                                        "colorStroke"
                                    );
                                }}
                            />
                        </Col>
                    </Row>
                </Form.Item>
            )}

            {showFillFormItem && (
                <Form.Item
                    style={customStyleFormItem}
                    label={gettext("Fill color")}
                >
                    <ColorPicker
                        presets={[
                            {
                                label: gettext("Colors"),
                                colors: presetColors,
                            },
                        ]}
                        value={value.fillStroke}
                        onChange={(e) => {
                            handleColorChange(e.toHexString(), "fillStroke");
                        }}
                    />
                </Form.Item>
            )}

            {showCircleSizeFormItem && (
                <Form.Item
                    style={customStyleFormItem}
                    label={gettext("Circle size, px")}
                >
                    <InputNumber
                        min={1}
                        max={100}
                        precision={0}
                        value={value.circleSize}
                        onChange={(newValue) =>
                            handleChange("circleSize", newValue ?? 5)
                        }
                    />
                </Form.Item>
            )}
        </Form>
    );
}
