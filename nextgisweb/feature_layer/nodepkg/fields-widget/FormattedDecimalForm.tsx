import { Checkbox, Form, Input, InputNumber, Space, Row, Col } from "@nextgisweb/gui/antd";
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
            style={{ padding: "0 1em 1em 1em" }}
        >
            <Space style={{ width: "100%" }} direction={'vertical'} size="middle">
                <Row gutter={[16, 16]} wrap={false} justify="space-between" align="middle">
                    <Col className="format-item">
                        <Form.Item noStyle name="checked" valuePropName="checked">
                            <Checkbox checked={value?.checked}>{gettext("Enable formatting")}</Checkbox>
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} wrap={false} justify="space-between" align="middle">
                    <Col className="format-item">
                        {gettext("Rounding off a number")}
                    </Col>
                    <Col className="format-item">
                        <Form.Item noStyle name="round">
                            <InputNumber value={value?.round} disabled={!value?.checked} max={12} min={0} style={{ width: "100%" }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} wrap={false} justify="space-between" align="middle">
                    <Col className="format-item">
                        {gettext("Value prefix")}
                    </Col>
                    <Col className="format-item">
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
