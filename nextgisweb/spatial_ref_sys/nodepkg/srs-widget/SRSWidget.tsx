import { useMemo, useState } from "react";

import { Button, Form, Input, Modal } from "@nextgisweb/gui/antd";
import type { FormField } from "@nextgisweb/gui/fields-form";
import { ModelForm } from "@nextgisweb/gui/model-form";
import { BaseAPIError, route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type {
    ConvertBody,
    SRSRead,
} from "@nextgisweb/spatial-ref-sys/type/api";

import getMessages from "../srsMessages";
import { modelObj } from "../srsModel";

import { SRSImportFrom } from "./SRSImportForm";

const DEFAULT_DATA: ConvertBody = { projStr: "", format: "proj4" };

export function SRSWidget({ id, readonly }: { id: number; readonly: boolean }) {
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isProtected, setIsProtected] = useState(false);
    const [isSystem, setIsSystem] = useState(false);
    const [form] = Form.useForm();
    const [modalForm] = Form.useForm<ConvertBody>();
    const fields = useMemo<FormField[]>(() => {
        return [
            {
                name: "display_name",
                label: gettext("Display name"),
                formItem: <Input />,
                required: true,
            },
            {
                name: "auth_name_srid",
                label: gettext("Authority and code"),
                formItem: <Input />,
                value: (record: SRSRead) =>
                    `${record.auth_name}:${record.auth_srid}`,
                disabled: true,
                included: id !== undefined && isProtected,
            },
            {
                name: "wkt",
                label: gettext("OGC WKT definition"),
                formItem: <Input.TextArea rows={4} />,
                required: true,
                disabled: isProtected,
            },
        ];
    }, [isProtected, id]);

    const showModal = () => {
        setIsModalVisible(true);
    };

    const handleOk = async () => {
        try {
            const json = await modalForm.validateFields();
            const resp = await route("spatial_ref_sys.convert").post({
                json,
            });
            const fields = form.getFieldsValue();
            form.setFieldsValue({ ...fields, wkt: resp.wkt });
            setIsModalVisible(false);
        } catch (err) {
            if (err instanceof BaseAPIError) {
                modalForm.setFields([
                    {
                        name: "projStr",
                        errors: [err.message],
                    },
                ]);
            } else {
                throw err;
            }
        }
    };

    const handleCancel = () => {
        modalForm.setFieldsValue(DEFAULT_DATA);
        setIsModalVisible(false);
    };

    // to not exec gettext on closed modal
    const Title = () => <>{gettext("Import definition")}</>;

    return (
        <>
            <ModelForm
                id={id}
                fields={fields}
                readonly={readonly}
                allowDelete={!isSystem}
                form={form}
                model={modelObj}
                labelCol={{ span: 5 }}
                messages={getMessages()}
                onChange={(obj) => {
                    const v = obj.value as SRSRead;
                    if (v) {
                        if (v.system !== undefined) {
                            setIsSystem(v.system);
                        }
                        if (v.protected !== undefined) {
                            setIsProtected(v.protected);
                        }
                    }
                }}
            >
                {!isProtected && (
                    <Form.Item wrapperCol={{ offset: 5 }}>
                        <Button size="small" onClick={showModal}>
                            {gettext("Import definition")}
                        </Button>
                    </Form.Item>
                )}
            </ModelForm>
            <Modal
                title={<Title />}
                open={isModalVisible}
                onOk={handleOk}
                onCancel={handleCancel}
            >
                <SRSImportFrom {...DEFAULT_DATA} form={modalForm} />
            </Modal>
        </>
    );
}
