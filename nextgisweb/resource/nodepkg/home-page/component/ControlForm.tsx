import { Button, Col, Form, Row } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Save from "@nextgisweb/icon/material/save";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import Restore from "@nextgisweb/icon/mdi/restore";

export const ControlForm = ({ handleCancel, resetForm }) => (
    <Row gutter={[16, 16]} justify="end">
        <Col>
            <Form.Item noStyle label={null}>
                <Button
                    title={gettext("Cancel")}
                    type="default"
                    icon={<Cancel />}
                    onClick={handleCancel}
                >
                    {gettext("Cancel")}
                </Button>
            </Form.Item>
        </Col>
        <Col>
            <Form.Item noStyle label={null}>
                <Button
                    title={gettext("Reset")}
                    type="default"
                    htmlType="reset"
                    icon={<Restore />}
                    onClick={resetForm}
                >
                    {gettext("Reset")}
                </Button>
            </Form.Item>
        </Col>
        <Col>
            <Form.Item noStyle label={null}>
                <Button
                    type="default"
                    htmlType="submit"
                    icon={<Save />}
                    title={gettext("Save")}
                >
                    {gettext("Save")}
                </Button>
            </Form.Item>
        </Col>
    </Row>
)