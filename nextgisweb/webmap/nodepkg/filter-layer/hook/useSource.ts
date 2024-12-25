import { route } from "@nextgisweb/pyramid/api";

export const useSource = () => {
    const getFields = async (item) => {
        const resourceId = item.layerId;

        const fields = await route("resource.item", { id: resourceId })
            .get({
                cache: true,
            })
        return { item, fields: fields.feature_layer.fields };
    }

    const getFeature = async (layerId, limit) => {
        const json = {
            geom: false,
            extensions: [],
            dt_format: "iso",
        };
        limit > 0 && Object.assign(json, { limit: limit })
        const feature = await route("feature_layer.feature.collection", { id: layerId })
            .get({
                cache: false,
                query: json,
            })
        return feature.map(item => item.fields);
    }

    return { getFeature, getFields };
};
