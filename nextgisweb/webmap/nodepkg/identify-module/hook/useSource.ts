import { route } from "@nextgisweb/pyramid/api";
import { useCallback, useState } from "react";
import lookupTableCached from "ngw-lookup-table/cached";
import moment from "moment";
import { gettext } from "@nextgisweb/pyramid/i18n";
export const useSource = () => {
    const [fields, setFields] = useState(undefined);

    const urlRegex = /^\s*(((((https?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;

    const emailRegex = new RegExp(/\S+@\S+\.\S+/);

    const resourceItem = async (layerId, fid) => {
        const feature = await route("feature_layer.feature.item", {
            id: layerId,
            fid: fid,
        })
            .get({
                cache: true,
            })
        return feature;
    }

    const fieldsAttribute = async (val) => {
        var fieldsCache = {};
        const item = await route("resource.item", val.layerId)
            .get({
                cache: true,
            })
            .then((item) => {
                return item
            });

        const feature = await route("feature_layer.feature.item", {
            id: val.layerId,
            fid: val.id,
        })
            .get({
                cache: true,
            })
            .then(i => {
                // if (item.feature_layer.fields.length === 0) {
                //     console.log(i);
                // } else {
                    const value = i.fields;
                    const fieldmap = {};
                    const deferreds: string[] = [];
                    item.feature_layer.fields.map(item => {
                        fieldmap[item.keyname] = item;
                        if (item.lookup_table !== null) {
                            deferreds.push(
                                lookupTableCached.load(
                                    item.lookup_table.id
                                )
                            );
                        }
                    })
                    fieldsCache[val.layerId] = fieldmap;
                    const valueRender = render(value, fieldmap)
                    return valueRender;

                // }
            })


        return feature;
    }

    const render = (value, fieldmap) => {
        const fieldsValue: string[] = [];

        for (const k in value) {
            let val = value[k];
            const field = fieldmap[k];
            
            if (!fieldmap[k].grid_visibility) {
                continue;
            }

            if (val === null) {
                return;
            } else if (field.datatype === "DATE") {
                val = moment(new Date(val.year, val.month - 1, val.day)).format("DD.MM.YYYY");
                fieldsValue.push({ type: "DATE", [field.display_name]: val });
            } else if (field.datatype === "TIME") {
                val = moment(new Date(0, 0, 0, val.hour, val.minute, val.second)).format("HH:mm:ss");
                fieldsValue.push({ type: "TIME", [field.display_name]: val });
            } else if (field.datatype === "DATETIME") {
                val = moment(new Date(
                    val.year,
                    val.month - 1,
                    val.day,
                    val.hour,
                    val.minute,
                    val.second
                )).format("DD.MM.YYYY HH:mm:ss");
                fieldsValue.push({ type: "DATETIME", [field.display_name]: val });
            }

            if (val !== null) {
                if (urlRegex.test(val)) {
                    fieldsValue.push({ type: "URL", [field.display_name]: val });
                } else if (emailRegex.test(val)) {
                    fieldsValue.push({ type: "EMAIL", [field.display_name]: val });
                } else {
                    if (field.lookup_table !== null) {
                        var lval = lookupTableCached.lookup(
                            field.lookup_table.id,
                            val
                        );
                        if (lval !== null) {
                            val = "[" + val + "] " + lval;

                        }
                        fieldsValue.push({ type: "LOOK_TABLE", [field.display_name]: val });
                    } else {
                        fieldsValue.push({ type: "www", [field.display_name]: val });
                    }
                }
            } else {
                fieldsValue.push({ type: "NODATA", [field.display_name]: val });
            }
        }
        return fieldsValue;
    };

    return { fieldsAttribute, resourceItem };
};
