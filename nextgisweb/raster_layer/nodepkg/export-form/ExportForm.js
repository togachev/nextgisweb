import PropTypes from "prop-types";
import settings from "@nextgisweb/pyramid/settings!raster_layer";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { useAbortController } from "@nextgisweb/pyramid/hook/useAbortController";

import { FieldsForm, Select, Form } from "@nextgisweb/gui/fields-form";
import { LoadingWrapper, SaveButton } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import { useMemo, useState, useEffect } from "react";
import i18n from "@nextgisweb/pyramid/i18n";

const srsListToOptions = (srsList) => {
    return srsList.map((srs) => {
        return {
            label: srs.display_name,
            value: srs.id,
        };
    });
};

const bandListToOptions = (bandList) => {
    return bandList.map((band, idx) => {
        return {
            label:
                i18n.gettext("Band") +
                " " +
                (idx + 1) +
                (band !== "Undefined" ? " (" + band + ")" : ""),
            value: idx + 1,
        };
    });
};

export function ExportForm({ id }) {
    const [status, setStatus] = useState("loading");
    const { makeSignal } = useAbortController();
    const [srsOptions, setSrsOptions] = useState([]);
    const [bandOptions, setBandOptions] = useState([]);
    const [defaultSrs, setDefaultSrs] = useState();
    const form = Form.useForm()[0];

    async function load() {
        try {
            const signal = makeSignal();
            const [srsInfo, itemInfo] = await Promise.all(
                [
                    route("spatial_ref_sys.collection"),
                    route("resource.item", id),
                ].map((r) => r.get({ signal }))
            );
            setSrsOptions(srsListToOptions(srsInfo));
            setBandOptions(
                bandListToOptions(itemInfo.raster_layer.color_interpretation)
            );
            setDefaultSrs(itemInfo.raster_layer.srs.id);
        } catch (err) {
            errorModal(err);
        } finally {
            setStatus("loaded");
        }
    }

    useEffect(() => load(), []);

    const fields = useMemo(
        () => [
            {
                name: "format",
                label: i18n.gettext("Format"),
                widget: Select,
                choices: settings.export_formats.map((format) => ({
                    value: format.name,
                    label: format.display_name,
                })),
            },
            {
                name: "srs",
                label: i18n.gettext("SRS"),
                widget: Select,
                choices: srsOptions,
            },
            {
                name: "bands",
                label: i18n.gettext("Bands"),
                widget: Select,
                mode: "multiple",
                choices: bandOptions,
            },
        ],
        [srsOptions, bandOptions]
    );

    const exportRaster = () => {
        const fields = form.getFieldsValue();
        window.open(
            routeURL("resource.export", id) +
                "?" +
                new URLSearchParams(fields).toString()
        );
    };

    if (status === "loading") {
        return <LoadingWrapper />;
    }

    return (
        <FieldsForm
            fields={fields}
            form={form}
            initialValues={{
                srs: defaultSrs,
                bands: bandOptions.map((band) => band.value),
                format: settings.export_formats[0].name,
            }}
            labelCol={{ span: 6 }}
        >
            <Form.Item>
                <SaveButton onClick={exportRaster} icon={null}>
                    {i18n.gettext("Save")}
                </SaveButton>
            </Form.Item>
        </FieldsForm>
    );
}

ExportForm.propTypes = {
    id: PropTypes.number,
};
