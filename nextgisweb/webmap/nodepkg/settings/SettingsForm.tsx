import { useState } from "react";

import {
    Col,
    FloatButton,
    Form,
    Input,
    InputNumber,
    Row,
    Select,
    Space,
    Switch,
    Tooltip,
    Typography,
} from "@nextgisweb/gui/antd";
import type { OptionType } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { WebMapCSettingsUpdate } from "@nextgisweb/webmap/type/api";

import {
    AddressGeocoderOptions,
    DegreeFormatOptions,
    LegendEnabledOptions,
    UnitsAreaOptions,
    UnitsLengthOptions,
} from "./select-options";

import { SaveOutlined, WarningOutlined } from "@ant-design/icons";
import ExperimentalIcon from "@nextgisweb/icon/material/science";
const { Title } = Typography;

const INPUT_DEFAULT_WIDTH = { width: "100%" };

const identifyModuleMsg = gettext(
    "Updated identification popup"
);

const offsetInfo = (
    <Tooltip title={gettext("For updated popup")}>
        <ExperimentalIcon />
    </Tooltip>
);

interface SettingsFormProps {
    onFinish: (values: WebMapCSettingsUpdate) => void;
    initialValues?: WebMapCSettingsUpdate;
    srsOptions: OptionType[];
    status: string;
}

export const SettingsForm: React.FC<SettingsFormProps> = ({
    onFinish,
    initialValues,
    srsOptions,
    status,
}) => {
    const [geocoder, setGeocoder] = useState<
        WebMapCSettingsUpdate["address_geocoder"]
    >(initialValues?.address_geocoder || "nominatim");

    const onValuesChange = (allValues: WebMapCSettingsUpdate) => {
        if ("address_geocoder" in allValues) {
            setGeocoder(allValues.address_geocoder);
        }
    };
    console.log(initialValues);
    
    return (
        <Form
            name="webmap_settings"
            className="webmap-settings-form"
            initialValues={initialValues}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
            layout="vertical"
        >
            <Title level={4}>{gettext("General")}</Title>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item>
                        <Space direction="horizontal">
                            <Form.Item
                                noStyle
                                name="hide_nav_menu"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                            {gettext("Hide navigation menu for guest")}
                        </Space>
                    </Form.Item>
                </Col>
            </Row>

            <Title level={4}>{gettext("Identification")}</Title>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item>
                        <Space direction="horizontal">
                            <Form.Item
                                noStyle
                                name="identify_attributes"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                            {gettext("Show feature attributes")}
                        </Space>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item>
                        <Space direction="horizontal">
                            <Form.Item
                                noStyle
                                name="show_geometry_info"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                            {gettext("Show geometry info")}
                        </Space>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item
                        name="identify_radius"
                        label={gettext("Radius, px")}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <InputNumber min={1} style={INPUT_DEFAULT_WIDTH} />
                    </Form.Item>
                </Col>
            </Row>

            <Title level={4}>{gettext("Custom map settings")}</Title>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Space direction="horizontal">
                        <Form.Item
                            noStyle
                            name="identify_module"
                            valuePropName="checked"
                        >
                            <Switch />
                        </Form.Item>
                        {identifyModuleMsg}
                    </Space>
                </Col>
                <Col span={8}>
                    <Space>
                        <Form.Item
                            name="max_count_file_upload"
                            label={gettext("Maximum uploaded files")}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber min="1" style={INPUT_DEFAULT_WIDTH} />
                        </Form.Item>
                    </Space>
                </Col>
                <Col span={8}>
                    <Space>
                        <Form.Item
                            name="offset_point"
                            label={gettext("Offset of popup relative to click point, px")}
                            rules={[
                                {
                                    required: true,
                                },
                            ]}
                        >
                            <InputNumber min="0" max="50" addonAfter={offsetInfo} style={INPUT_DEFAULT_WIDTH} />
                        </Form.Item>
                    </Space>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name={["popup_size", "width"]}
                        label={gettext("Width, px")}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <InputNumber min={100} style={INPUT_DEFAULT_WIDTH} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name={["popup_size", "height"]}
                        label={gettext("Height, px")}
                        rules={[
                            {
                                required: true,
                            },
                        ]}
                    >
                        <InputNumber min={100} style={INPUT_DEFAULT_WIDTH} />
                    </Form.Item>
                </Col>
            </Row>

            <Title level={4}>{gettext("Measurement")}</Title>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item
                        name="units_length"
                        label={gettext("Length units")}
                    >
                        <Select
                            options={UnitsLengthOptions}
                            style={INPUT_DEFAULT_WIDTH}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="units_area" label={gettext("Area units")}>
                        <Select
                            options={UnitsAreaOptions}
                            style={INPUT_DEFAULT_WIDTH}
                        />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item
                        name="degree_format"
                        label={gettext("Degree format")}
                    >
                        <Select
                            options={DegreeFormatOptions}
                            style={INPUT_DEFAULT_WIDTH}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={24}>
                    <Form.Item
                        name="measurement_srid"
                        label={gettext("Measurement SRS")}
                    >
                        <Select
                            options={srsOptions}
                            style={INPUT_DEFAULT_WIDTH}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Title level={4}>{gettext("Address search")}</Title>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item>
                        <Space direction="horizontal">
                            <Form.Item
                                noStyle
                                name="address_search_enabled"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                            {gettext("Enable")}
                        </Space>
                    </Form.Item>
                </Col>
                <Col span={16}>
                    <Form.Item>
                        <Space direction="horizontal">
                            <Form.Item
                                noStyle
                                name="address_search_extent"
                                valuePropName="checked"
                            >
                                <Switch />
                            </Form.Item>
                            {gettext("Limit by web map initial extent")}
                        </Space>
                    </Form.Item>
                </Col>
            </Row>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item
                        name="address_geocoder"
                        label={gettext("Provider")}
                    >
                        <Select
                            options={AddressGeocoderOptions}
                            style={INPUT_DEFAULT_WIDTH}
                        />
                    </Form.Item>
                </Col>
                <Col span={16}>
                    {geocoder === "nominatim" ? (
                        <Form.Item
                            name="nominatim_countrycodes"
                            label={gettext("Limit search results to countries")}
                            rules={[
                                {
                                    pattern: new RegExp(
                                        /^(?:(?:[A-Za-z]+)(?:-[A-Za-z]+)?(?:,|$))+(?<!,)$/
                                    ),
                                    message: (
                                        <div>
                                            {
                                                // prettier-ignore
                                                gettext("Invalid countries. For example ru or gb,de")
                                            }
                                        </div>
                                    ),
                                },
                            ]}
                        >
                            <Input style={INPUT_DEFAULT_WIDTH} />
                        </Form.Item>
                    ) : (
                        <Form.Item
                            name="yandex_api_geocoder_key"
                            label={gettext("Yandex.Maps API Geocoder Key")}
                        >
                            <Input style={INPUT_DEFAULT_WIDTH} />
                        </Form.Item>
                    )}
                </Col>
            </Row>

            <Title level={4}>{gettext("Legend")}</Title>

            <Row gutter={[16, 16]}>
                <Col span={8}>
                    <Form.Item
                        name="legend_symbols"
                        normalize={(val: string) =>
                            val === "default" ? null : val
                        }
                        getValueProps={(val: string) => {
                            val = !val ? "default" : val;
                            return { value: val };
                        }}
                        label={gettext("Visibility")}
                    >
                        <Select
                            options={LegendEnabledOptions}
                            style={INPUT_DEFAULT_WIDTH}
                        />
                    </Form.Item>
                </Col>
            </Row>

            <Row className="row-submit">
                <Col>
                    <FloatButton
                        tooltip={gettext("Save")}
                        htmlType="submit"
                        type={"primary"}
                        icon={
                            status === "saved-error" ? (
                                <WarningOutlined />
                            ) : (
                                <SaveOutlined />
                            )
                        }
                    >
                        {gettext("Save")}
                    </FloatButton>
                </Col>
            </Row>
        </Form>
    );
};
