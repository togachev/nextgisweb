import { useCallback, useEffect, useState } from "react";

import { topics } from "@nextgisweb/webmap/identify-module";

export const useFilter = () => {
    const [filterKeys, setFilterKeys] = useState<object>();
    const [idNode, setIdNode] = useState<number>();

    topics.subscribe("removeTabFilter",
        async (e) => {
            setFilterKeys(prev => {
                const state = { ...prev };
                delete state[e.detail];
                return state;
            });
        }
    );

    const filtered = useCallback(() => {
        const value = filterKeys && Object.entries(filterKeys).filter(([key, value]) => value === idNode)[0];
        return value;
    })

    return { filterKeys, setFilterKeys, idNode, setIdNode, filtered };
};
