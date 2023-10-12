import { useEffect, useState } from "react";

import {
    Col,
    Radio,
    Row,
    Space,
    Typography,
    message,
} from "@nextgisweb/gui/antd";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import type { ApiError } from "@nextgisweb/gui/error/type";
import { route } from "@nextgisweb/pyramid/api";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { gettext } from "@nextgisweb/pyramid/i18n";

export function ExportSettings() {
    const [saving, setSaving] = useState(false);

    const { data, isLoading } = useRouteGet<{ resource_export: string }>(
        "resource.resource_export"
    );
    const [value, setValue] = useState<string>();

    async function save() {
        setSaving(true);
        try {
            await route("resource.resource_export").put({
                json: { resource_export: value },
            });
            message.success(gettext("The setting is saved."));
        } catch (err) {
            errorModal(err as ApiError);
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        if (data) {
            setValue(data.resource_export);
        }
    }, [data]);

    if (isLoading) {
        return <LoadingWrapper />;
    }

    return (
        <Space direction="vertical">
            <Typography.Text>
                {gettext(
                    'Select the category of users who can use the "Save as" link to download resource data.'
                )}
            </Typography.Text>
            <Radio.Group
                value={value}
                onChange={(e) => setValue(e.target.value)}
            >
                <Space direction="vertical">
                    <Radio value="data_read">
                        {gettext('Users with "Data: Read" permission')}
                    </Radio>
                    <Radio value="data_write">
                        {gettext('Users with "Data: Write" permission')}
                    </Radio>
                    <Radio value="administrators">
                        {gettext("Administrators")}
                    </Radio>
                </Space>
            </Radio.Group>
            <Row align="middle" style={{ marginTop: "1em" }}>
                <Col flex="none">
                    <SaveButton onClick={save} loading={saving}>
                        {gettext("Save")}
                    </SaveButton>
                </Col>
                <Col flex="auto" style={{ marginLeft: "4em" }}>
                    <Typography.Text
                        type="secondary"
                        style={{ marginTop: "8em" }}
                    >
                        {gettext(
                            "* This will not affect REST API use which will continue to be governed by permissions."
                        )}
                    </Typography.Text>
                </Col>
            </Row>
        </Space>
    );
}
