import { route } from "@nextgisweb/pyramid/api";

export const useSource = () => {

    const getListMap = async () => {
        const maplist = await route("resource.maplist").get(); // список карт
        const maplist_action_map = maplist.result.filter(item => item.action_map === true);
        return maplist_action_map;
    }

    const getGroupMap = async () => {
        const groupMaps = await route("resource.mapgroup").get(); // список групп
        const groupMaps_action_map = groupMaps?.filter(item => item.action_map === true);
        return groupMaps_action_map;
    }

    return { getListMap, getGroupMap };
};
