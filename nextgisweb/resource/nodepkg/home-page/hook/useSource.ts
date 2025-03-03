import { route } from "@nextgisweb/pyramid/api";
import { useEffect, useState } from "react";

export const useSource = (ref) => {
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [containerWidth, setContainerWidth] = useState(0);
    const [collapse, setCollapse] = useState(false);

    const getListMap = async () => {
        const maplist = await route("resource.maplist").get(); // список карт
        const maplist_action_map = maplist.result.filter(item => item.action_map === true);
        return maplist_action_map;
    }

    useEffect(() => {
        const cb = () => {
            setWindowWidth(window.innerWidth - window.innerWidth / 100 * 20);
        };
        window.addEventListener("resize", cb);

        const observer = new ResizeObserver((entries) => {
            setContainerWidth(entries[0].contentRect.width);
        });

        if (ref?.current) {
            observer.observe(ref.current);
        }

        return () => {
            ref.current && observer.unobserve(ref.current);
            window.removeEventListener("resize", cb);
        };
    }, []);

    useEffect(() => {
        if (windowWidth >= containerWidth) {
            setCollapse(false)
        } else {
            setCollapse(true)
        }
    }, [windowWidth, containerWidth]);


    const getGroupMap = async () => {
        const groupMaps = await route("resource.mapgroup").get(); // список групп
        const groupMaps_action_map = groupMaps?.filter(item => item.action_map === true);
        return groupMaps_action_map;
    }

    const getPermission = async (id) => {
        const value = await route("resource.permission", id).get();
        return value;
    }

    return { getListMap, getGroupMap, getPermission, collapse };
};
