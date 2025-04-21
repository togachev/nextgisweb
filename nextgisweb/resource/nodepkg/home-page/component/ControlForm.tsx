import { Button, Form, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Save from "@nextgisweb/icon/material/save";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import Restore from "@nextgisweb/icon/mdi/restore";

export const ControlForm = ({ handleCancel, resetForm }) => (
    <Space wrap>
        <Form.Item noStyle label={null}>
            <Button
                title={gettext("Cancel")}
                type="default"
                icon={<Cancel />}
                onClick={handleCancel}
            >
                {window.innerWidth >= 466 && window.innerHeight >= 466 && gettext("Cancel")}
            </Button>
        </Form.Item>
        <Form.Item noStyle label={null}>
            <Button
                title={gettext("Reset")}
                type="default"
                htmlType="reset"
                icon={<Restore />}
                onClick={resetForm}
            >
                {window.innerWidth >= 466 && window.innerHeight >= 466 && gettext("Reset")}
            </Button>
        </Form.Item>
        <Form.Item noStyle label={null}>
            <Button
                type="default"
                htmlType="submit"
                icon={<Save />}
                title={gettext("Save")}
            >
                {window.innerWidth >= 466 && window.innerHeight >= 466 && gettext("Save")}
            </Button>
        </Form.Item>
    </Space>
)