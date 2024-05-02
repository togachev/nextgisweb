import { route } from "@nextgisweb/pyramid/api";

export const useSource = () => {

    const resourceItem = async (layerId, fid) => {
        await route("feature_layer.feature.item", {
            id: layerId,
            fid,
        })
            .get({
                cache: true,
            })
            .then((item) => {
                console.log(item);
            })
    }

    return { resourceItem };
};
