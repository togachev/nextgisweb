import React, { useState } from "react";
import { Button, Checkbox, Form, Input, InputNumber, Space } from "@nextgisweb/gui/antd";

export const FormattedDecimalForm = ({ value, onChange }) => {
    const [form] = Form.useForm();
    const [formatInitial, setFormatInitial] = useState(value);
    const [fieldSetting, setFieldSetting] = useState();

    console.log(fieldSetting);

    const onChangeFormat = (e) => {
        setFieldSetting({
            ...fieldSetting,
            checked: e.target.checked,
        });
    };

    const onFinish = (value) => {
        onChange(value);
    };

    const onReset = () => {
        setFieldSetting(formatInitial);
        form.resetFields();
    };

    return (
        <Space direction="vertical">
            <Form form={form} onFinish={onFinish} initialValues={formatInitial}>
                <Form.Item name="checked" valuePropName="checked" label={null}>
                    <Checkbox onChange={onChangeFormat}>checked</Checkbox>
                </Form.Item>
                {fieldSetting?.checked === true && (
                    <>
                        <Form.Item name="round" label="round">
                            <InputNumber max={12} min={0} />
                        </Form.Item>

                        <Form.Item name="prefix" label="prefix">
                            <Input />
                        </Form.Item>
                    </>
                )}
                <Form.Item>
                    <Space>
                        <Button type="primary" htmlType="submit">
                            Submit
                        </Button>
                        <Button danger onClick={onReset}>
                            Reset
                        </Button>
                    </Space>
                </Form.Item>
            </Form>
        </Space>
    );
};

export default FormattedDecimalForm;
