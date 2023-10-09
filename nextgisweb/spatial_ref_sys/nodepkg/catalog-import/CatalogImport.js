import { useEffect, useState } from "react";

import { Button, Form } from "@nextgisweb/gui/antd";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import { FieldsForm } from "@nextgisweb/gui/fields-form";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

export function CatalogImport({ url, id }) {
    const [status, setStatus] = useState("loading");
    const [data, setData] = useState(null);

    const [fields] = useState([
        {
            name: "display_name",
            label: gettext("Display name"),
            readOnly: true,
        },
        {
            name: "wkt",
            label: gettext("OGC WKT definition"),
            readOnly: true,
            widget: "textarea",
            rows: 4,
            style: { margin: "0" },
        },
    ]);

    useEffect(async () => {
        try {
            const srs = await route("spatial_ref_sys.catalog.item", id).get();
            setData(srs);
            setStatus(null);
        } catch (err) {
            errorModal(err);
            setStatus("error");
        }
    }, []);

    if (status === "loading") {
        return <LoadingWrapper />;
    } else if (status === "error") {
        return null;
    }

    const showSrsDetailInfo = () => {
        window.open(url, "_blank");
    };

    const importSrs = async () => {
        setStatus("importing");
        try {
            const resp = await route("spatial_ref_sys.catalog.import").post({
                json: { catalog_id: id },
            });
            window.open(routeURL("srs.edit", resp.id), "_self");
        } catch (err) {
            errorModal(err);
        } finally {
            setStatus(null);
        }
    };

    return (
        <FieldsForm fields={fields} initialValues={data}>
            <Form.Item>
                <Button
                    onClick={showSrsDetailInfo}
                    type="link"
                    size="small"
                    style={{ padding: 0 }}
                >
                    {gettext("View details")}
                </Button>
            </Form.Item>
            <Form.Item>
                <SaveButton
                    onClick={importSrs}
                    icon={null}
                    loading={status === "importing"}
                >
                    {gettext("Import")}
                </SaveButton>
            </Form.Item>
        </FieldsForm>
    );
}
