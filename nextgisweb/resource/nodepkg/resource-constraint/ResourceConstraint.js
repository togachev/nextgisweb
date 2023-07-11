import { useState, useEffect } from "react";
import Select from 'react-select';
import { route } from "@nextgisweb/pyramid/api";
import getSelectStyle from "./selectStyle";
import makeAnimated from 'react-select/animated';
import i18n from "@nextgisweb/pyramid/i18n";
import { SaveButton } from "@nextgisweb/gui/component";
import { errorModal } from "@nextgisweb/gui/error";
import "./ResourceConstraint.less";
import { message } from "@nextgisweb/gui/antd";
const animatedComponents = makeAnimated();

export function ResourceConstraint(props) {

    const [fields, setFields] = useState();
    const [items, setItem] = useState();
    const [fieldsConst, setFieldsConst] = useState();

    const [column_from_const, setColumn_from_const] = useState({ value: props.column_from_const ? props.column_from_const : null, label: props.column_from_const ? props.column_from_const : null});
    const [column_key, setColumn_key] = useState({ value: props.column_key ? props.column_key : null, label: props.column_key ? props.column_key : null});
    const [column_constraint, setColumn_constraint] = useState({ value: props.column_constraint ? props.column_constraint : null, label: props.column_constraint ? props.column_constraint : null});

    const [resId, setResId] = useState();
    const [saving, setSaving] = useState(false);

    // field resource
    useEffect(() => {
        let isSubscribed = true;
        const getField = async () => {
            const data = await route('resource.item', props.id).get();
            const filter = data.feature_layer.fields.map((item) => {
                return {value: item.keyname, label: item.keyname}
            });
            if (isSubscribed) {
                setFields(filter);
            };
        }
        getField().catch(console.error);
        return () => isSubscribed = false;
    }, [])

    useEffect(() => {
        let isSubscribed = true;
        const getAllData = async () => {
            const data = await route('resource.tbl_res').get();
            const filter_id = data.filter((item) => { return item.id !== props.id });
            const items = filter_id.map((item) => { return {value: item.id, label: item.name, fields: item.fields} });
            if (isSubscribed) {
                setItem(items);
            };
        }
        getAllData().catch(console.error);
        return () => isSubscribed = false;
    }, [])

    // fields
    useEffect(() => {
        let isSubscribed = true;
        if (items) {
            const getFieldConst = async () => {
                const filter = Object.values(items).filter((item) => {
                    return item.value == resId 
                })
                if (isSubscribed) {
                    setFieldsConst(filter[0].fields);
                };
            }
            getFieldConst().catch(console.error);            
        }
        return () => isSubscribed = false;
    }, [resId])

    const onClear = () => {
        setColumn_from_const(null)
        setColumn_key(null)
        setColumn_constraint(null)
    };
    
  
    const onChange = (value, context, el) => {
        if (el == 'column_from_const') {
            if (context.action === "select-option") {
                setColumn_from_const(value)
            }
            else if (context.action === "clear") {
                setColumn_from_const(null)
            }
        }
        else if (el == 'column_key') {
            if (context.action === "select-option") {
                setResId(value.value)
                setColumn_key(value)
                setColumn_constraint(null)
            }
            else if (context.action === "clear") {
                setColumn_key(null)
            }
        }
        else if (el == 'column_constraint') {
            if (context.action === "select-option") {
                setColumn_constraint(value)
            }
            else if (context.action === "clear") {
                setColumn_constraint(null)
            }
        }
        // if (context.action === "clear") {
        //     onClear()
        // }
    }

    const query = { [props.cls] : {
        column_from_const: (column_from_const ? column_from_const.value : null),
        column_key: (column_key ? column_key.value : null),
        column_constraint: (column_constraint ? column_constraint.value : null)
    } }

    async function save() {
        setSaving(true);
        try {
            await route("resource.item", props.id).put({
                json: query
            });
            message.success(i18n.gettext("The setting is saved."));
        } catch (err) {
            errorModal(err);
        } finally {
            setSaving(false);
        }
    }

    return (
        <>
            <div className="block">
                <span>
                    <div>{i18n.gettext("Column from constraint")}</div>
                    <Select
                        key={fields}
                        options={fields}
                        isClearable={true}
                        defaultValue={{ value: props.column_from_const, label: props.column_from_const}}
                        value={column_from_const}
                        onChange={(value, context) => onChange(value, context, 'column_from_const')}
                        styles={getSelectStyle()}
                        components={animatedComponents}
                    />                
                </span>
                <span>
                    <div>{i18n.gettext("ID column key")}</div>
                    <Select
                        key={items}
                        options={items}
                        isClearable={true}
                        defaultValue={{ value: props.column_key, label: props.display_name_const}}
                        onChange={(value, context) => onChange(value, context, 'column_key')}
                        styles={getSelectStyle()}
                        components={animatedComponents}
                    />
                </span>
                <span>
                    <div>{i18n.gettext("Column constraint resource")}</div>
                    <Select
                        key={fieldsConst}
                        options={fieldsConst}
                        isClearable={true}
                        defaultValue={{ value: props.column_constraint, label: props.column_constraint}}
                        value={column_constraint}
                        onChange={(value, context) => onChange(value, context, 'column_constraint')}
                        styles={getSelectStyle()}
                        components={animatedComponents}
                    />
                </span>
            </div>
            <SaveButton
                onClick={save}
                loading={saving}
            >
                {i18n.gettext("Save")}
            </SaveButton>
        </>
    );
}