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

    const getFeature = async (layerId) => {
        const feature = await route("feature_layer.feature.collection", { id: layerId })
            .get({
                cache: false,
                query: {
                    geom: false,
                    extensions: [],
                    limit: 10,
                    dt_format: "iso",
                },
            })
        return feature.map(item => item.fields);
    }

    return { getFeature, getFields };
};
