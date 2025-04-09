import { Checkbox, Form, Input, InputNumber, Space, Row, Col } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { FormatNumberFieldData } from "./FieldsStore";

export const FormattedDecimalForm = ({ value, onChange }) => {
    const [form] = Form.useForm<FormatNumberFieldData>();
    console.log(value);
    
    const onValuesChange = (changedValues: any, values: any) => {
        onChange(values);
    };

    return (
        <Form
            size="middle"
            form={form}
            initialValues={value}
            onValuesChange={onValuesChange}
            className="format-component"
        >
            <Space className="title-formatting" direction="horizontal" size="middle">
                <span>{gettext("Setting up value formatting")}</span>
                <Form.Item noStyle name="checked" valuePropName="checked">
                    <Checkbox checked={value?.checked}>{gettext("Enable formatting")}</Checkbox>
                </Form.Item>
            </Space>
            {value?.checked && (<Space style={{ width: "100%" }} direction="vertical" size="middle">
                <Row gutter={[16, 16]} wrap={false} justify="space-between" align="middle">
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
            </Space>)}
        </Form>
    );
};

export default FormattedDecimalForm;
