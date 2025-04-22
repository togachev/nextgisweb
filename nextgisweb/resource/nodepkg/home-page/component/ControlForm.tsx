import { useState, useRef, useLayoutEffect } from "react";
import { Button, Form, Space } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import Save from "@nextgisweb/icon/material/save";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import Restore from "@nextgisweb/icon/mdi/restore";

export const ControlForm = ({ handleCancel, minVal = 500, resetForm }) => {
    const refContainer = useRef(document.body);
    const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
    useLayoutEffect(() => {
        const handleResize = () => {
            setSize(getSize(getComputedStyle(refContainer.current)));
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [window.innerWidth, window.innerHeight]);

    const getSize = (cssStyleDeclaration) => {
        if (cssStyleDeclaration.boxSizing === "border-box") {
            return {
                h: parseInt(cssStyleDeclaration.height, 10),
                w: parseInt(cssStyleDeclaration.width, 10),
            };
        }

        return {
            h:
                parseInt(cssStyleDeclaration.height, 10) +
                parseInt(cssStyleDeclaration.marginTop, 10) +
                parseInt(cssStyleDeclaration.marginBottom, 10),
            w:
                parseInt(cssStyleDeclaration.width, 10) +
                parseInt(cssStyleDeclaration.marginLeft, 10) +
                parseInt(cssStyleDeclaration.marginRight, 10),
        };
    };

    return (
        <Space direction="horizontal">
            <Form.Item noStyle label={null}>
                <Button
                    title={gettext("Cancel")}
                    type="default"
                    icon={<Cancel />}
                    onClick={handleCancel}
                >
                    {size?.w - 32 > minVal && size?.h > minVal && gettext("Cancel")}
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
                    {size?.w - 32 > minVal && size?.h > minVal && gettext("Reset")}
                </Button>
            </Form.Item>
            <Form.Item noStyle label={null}>
                <Button
                    type="default"
                    htmlType="submit"
                    icon={<Save />}
                    title={gettext("Save")}
                >
                    {size?.w - 32 > minVal && size?.h > minVal && gettext("Save")}
                </Button>
            </Form.Item>
        </Space>
    )
}