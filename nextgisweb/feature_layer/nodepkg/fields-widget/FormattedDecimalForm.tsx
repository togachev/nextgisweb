import { Checkbox, Divider, Form, Input, InputNumber, Space, Row, Col } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { FormatNumberFieldData } from "./FieldsStore";

import "./FormattedDecimalForm.less";

export const FormattedDecimalForm = ({ value, onChange }) => {
    const [form] = Form.useForm<FormatNumberFieldData>();

    const onValuesChange = (_, value) => {
        onChange(value);
    };

    return (
        <Form
            size="middle"
            form={form}
            initialValues={value}
            onValuesChange={onValuesChange}
            className="format-component"
        >
            <Divider orientation="left" plain>{gettext("Setting up value formatting")}</Divider>
            <Space style={{ width: "100%" }} direction={'vertical'} size="middle">
                <Row gutter={[16, 16]} wrap={false} justify="space-between" align="middle">
                    <Col>
                        <Form.Item noStyle name="checked" valuePropName="checked">
                            <Checkbox checked={value?.checked}>{gettext("Enable formatting")}</Checkbox>
                        </Form.Item>
                    </Col>
                    <Divider type="vertical" />
                    <Col >
                        {gettext("Rounding off a number")}
                    </Col>
                    <Col flex="auto" >
                        <Form.Item noStyle name="round">
                            <InputNumber value={value?.round} disabled={!value?.checked} max={12} min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} wrap={false} justify="space-between" align="middle">
                    <Col>
                        {gettext("Value prefix")}
                    </Col>
                    <Col flex="auto" >
                        <Form.Item noStyle name="prefix">
                            <Input value={value?.prefix} disabled={!value?.checked} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Space>
        </Form>
    );
};

export default FormattedDecimalForm;
