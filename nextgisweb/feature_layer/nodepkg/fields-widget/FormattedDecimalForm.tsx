import { Checkbox, Form, Input, InputNumber, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { FormatNumberFieldData } from "./FieldsStore";
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
            style={{ padding: "1em" }}
        >
            <Space direction="vertical" size="middle">
                <Form.Item noStyle name="checked" valuePropName="checked">
                    <Checkbox checked={value?.checked}>{gettext("Enable formatting")}</Checkbox>
                </Form.Item>
                <Space>
                    {gettext("Rounding off a number")}
                    <Form.Item noStyle name="round">
                        <InputNumber value={value?.round} disabled={!value?.checked} max={12} min={0} />
                    </Form.Item>
                </Space>
                <Space>
                    {gettext("Value prefix")}
                    <Form.Item noStyle name="prefix">
                        <Input value={value?.prefix} disabled={!value?.checked} />
                    </Form.Item>
                </Space>
            </Space>
        </Form>
    );
};

export default FormattedDecimalForm;
