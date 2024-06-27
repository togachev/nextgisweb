import { route } from "@nextgisweb/pyramid/api";

export const useSource = () => {

    const getListMap = async () => {
        const maplist = await route("resource.maplist").get(); // список карт
        const maplist_action_map = maplist.result.filter(item => item.action_map === true);
        return maplist_action_map;
    }

    return { getListMap };
};
