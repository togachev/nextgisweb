import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState, useEffect } from "react";

import { Button, Tooltip } from "@nextgisweb/gui/antd";
import { LoadingWrapper } from "@nextgisweb/gui/component";
import type { EditorWidgetProps } from "@nextgisweb/feature-layer/feature-editor/type";

import {
    BigInteger,
    DateInput,
    DateTimeInput,
    FieldsForm,
    Form,
    Input,
    Integer,
    Number,
    TimeInput,
} from "@nextgisweb/gui/fields-form";

import { gettext } from "@nextgisweb/pyramid/i18n";

import BackspaceIcon from "@material-icons/svg/backspace";
import AttributeEditorStore from "./AttributeEditorStore";

import type {
    SizeType,
    FormField,
    FormWidget,
} from "@nextgisweb/gui/fields-form";
import type { NgwAttributeValue } from "./type";
import type { FeatureLayerDataType, FeatureLayerField } from "../type";

const style = { width: "100%" };

const ngwTypeAliases: Record<
    FeatureLayerDataType,
    [widget: FormWidget, props?: Record<string, unknown>]
> = {
    STRING: [Input],
    REAL: [Number, { style }],
    INTEGER: [Integer, { style }],
    BIGINT: [BigInteger, { style }],
    DATETIME: [DateTimeInput, { style, allowClear: false }],
    DATE: [DateInput, { style, allowClear: false }],
    TIME: [TimeInput, { style, allowClear: false }],
};

const setNullTitle = gettext("Set field value to NULL (No data)");

interface AttributeEditorStoreProps
    extends EditorWidgetProps<NgwAttributeValue | null, AttributeEditorStore> {
    fields?: FeatureLayerField[];
    onChange?: (value: NgwAttributeValue | null) => void;
}

const AttributeEditor = observer(
    ({
        store: store_,
        fields: fields_,
        onChange,
    }: AttributeEditorStoreProps) => {
        const [store] = useState(() => {
            if (store_) {
                return store_;
            }
            return new AttributeEditorStore({ fields: fields_ });
        });

        const { fields, attributes, isReady, setValues, saving } = store;
        const [size] = useState<SizeType>("small");
        const form = Form.useForm()[0];

        const setNullForField = useCallback(
            (field) => {
                form.setFieldValue(field, null);
                setValues({ [field]: null });
            },
            [form, setValues]
        );

        useEffect(() => {
            if (isReady) {
                form.setFieldsValue(attributes);
            }
        }, [isReady, form, attributes]);

        useEffect(() => {
            if (onChange) {
                onChange(store.value);
            }
        }, [store.value, onChange]);

        const formFields = useMemo(() => {
            return fields.map((field) => {
                const widgetAlias = ngwTypeAliases[field.datatype];
                const [widget, inputProps] = widgetAlias;

                const props: FormField = {
                    name: field.keyname,
                    label: field.display_name,
                    widget,
                    inputProps: {
                        readOnly: saving,
                        ...inputProps,
                    },
                    append: (
                        <Tooltip title={setNullTitle} placement="right">
                            <Button
                                onClick={() => {
                                    setNullForField(field.keyname);
                                }}
                            >
                                <BackspaceIcon
                                    style={{ verticalAlign: "middle" }}
                                />
                            </Button>
                        </Tooltip>
                    ),
                };
                const val = attributes[field.keyname];
                if (val === null) {
                    props.placeholder = "NULL";
                }

                return props;
            });
        }, [fields, attributes, setNullForField, saving]);

        if (!isReady) {
            return <LoadingWrapper />;
        }

        return (
            <div className="ngw-gui-antd-tab-padding">
                <FieldsForm
                    form={form}
                    size={size}
                    fields={formFields}
                    initialValues={attributes}
                    onChange={async (v) => {
                        if (await v.isValid()) {
                            setValues(v.value);
                        }
                    }}
                />
            </div>
        );
    }
);

export default AttributeEditor;
