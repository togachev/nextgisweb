import { route } from "@nextgisweb/pyramid/api";
import lookupTableCached from "ngw-lookup-table/cached";

export const useSource = () => {

    const getFeature = async (res) => {
        const resourceId = res.layerId;
        const feature = await route("feature_layer.feature.item_iso", {
            id: res.layerId,
            fid: res.id,
        })
            .get()
            .then(item => {
                return item;
            });

        const fieldsCache = {};
        const fieldmap = resourceId in fieldsCache ?
            fieldsCache[resourceId] :
            await route("resource.fields", { id: resourceId })
                .get({
                    cache: true,
                })
                .then(data => {
                    const deferreds: string[] = [];
                    const fieldmap = {};
                    data.map(itm => {
                        fieldmap[itm.keyname] = itm;
                        if (itm.lookup_table !== null) {
                            deferreds.push(
                                lookupTableCached.load(
                                    itm.lookup_table.id
                                )
                            );
                        }
                    })
                    fieldsCache[resourceId] = fieldmap;
                    return Promise.all(deferreds).then(
                        () => {
                            const value = feature.fields;
                            const rename = (renameKeys, currentObject) => {
                                return Object.keys(currentObject).reduce(
                                    (acc, key) => ({
                                        ...acc,
                                        ...{ [renameKeys[key] || key]: currentObject[key] },
                                    }),
                                    {}
                                );
                            };
                            const renameKeys = {};
                            for (const k in value) {
                                const val = value[k];
                                const field = fieldmap[k];

                                if (!fieldmap[k].grid_visibility) {
                                    continue;
                                }

                                if (field.lookup_table !== null) {
                                    const lval = lookupTableCached.lookup(
                                        field.lookup_table.id,
                                        val
                                    );
                                    if (lval !== null) {
                                        value[k] = lval;
                                    }
                                }
                                Object.assign(renameKeys, { [k]: fieldmap[k].display_name })
                            }
                            return rename(renameKeys, value);
                        }
                    );

                })
        return fieldmap;
    }

    return { getFeature };
};
