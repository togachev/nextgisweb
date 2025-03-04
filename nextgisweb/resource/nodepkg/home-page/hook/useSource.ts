import { route } from "@nextgisweb/pyramid/api";
import { useEffect, useState, useRef } from "react";
import { debounce } from "lodash-es";

export const useSource = (refMenu, refMenus) => {
    const [collapse, setCollapse] = useState(refMenus?.current?.offsetWidth >= refMenu?.current?.offsetWidth ? false : true);

    const [size, setSize] = useState({
        widthContainer: 0,
        widthChildContainer: 0,
    })

    useEffect(() => {

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                console.log(entry);

                // setSize({ widthContainer: entry.contentRect.width, widthChildContainer: entry.contentRect.width })
            }
        });
        if (refMenu?.current) {
            observer.observe(refMenu.current);
        }
        if (refMenus?.current) {
            observer.observe(refMenus.current);
        }
        // Cleanup function
        return () => {
            observer.disconnect();
        };
    }, [])

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

    const getPermission = async (id) => {
        const value = await route("resource.permission", id).get();
        return value;
    }

    return { getListMap, getGroupMap, getPermission, collapse, size };
};
