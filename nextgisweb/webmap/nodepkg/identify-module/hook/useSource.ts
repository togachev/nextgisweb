import { route } from "@nextgisweb/pyramid/api";
import { useState } from 'react';

export const useSource = () => {
    const [fields, setFields] = useState(undefined);

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
        await route("resource.item", val.layerId)
            .get({
                cache: true,
            })
            .then((item) => {
                if (item.feature_layer.fields.length === 0) {
                    return;
                } else {
                    resourceItem(val.layerId, val.value)
                        .then(i => {
                            console.log(i);
                            console.log(item.feature_layer);
                        })
                }

            });
        return fields;
    }

    return { fieldsAttribute, resourceItem };
};
