import React, { useState } from "react";
import { Button, Checkbox, Form, Input, InputNumber, Space } from "@nextgisweb/gui/antd";

export const FormattedDecimalForm = ({ value, onChange }) => {
    const [form] = Form.useForm();

    const [fieldSetting, setFieldSetting] = useState();

    const onFinish = (value) => {
        onChange(value);
    };

    const onReset = () => {
        form.resetFields();
    };

    return (
        <Space direction="vertical">
            <Form form={form} onFinish={onFinish} initialValues={value}>
                <Form.Item name="checked" valuePropName="checked" label={null}>
                    <Checkbox checked={value?.checked}>checked</Checkbox>
                </Form.Item>
                {value?.checked === true && (
                    <>
                        <Form.Item name="round" label="round">
                            <InputNumber value={value?.round} max={12} min={0} />
                        </Form.Item>

                        <Form.Item name="prefix" label="prefix">
                            <Input value={value?.prefix} />
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
