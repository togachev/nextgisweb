import { useEffect, useReducer, useCallback, useState } from "react";
import type { Display } from "@nextgisweb/webmap/display";

type Entries<T> = { [K in keyof T]: [K, T[K]]; }[keyof T][];

export const getEntries = <T extends object>(obj: T) => Object.entries(obj) as Entries<T>;

interface resetProps {
    reset: boolean;
    resetExtent: boolean;
}

export const useComponent = (display: Display) => {
    const [status, setStatus] = useState<resetProps>({
        reset: true,
        resetExtent: true,
    });

    const valueCheckbox = (attribute) => {
        const attr = Object.keys(status).find(key => key !== attribute) as string;
        if (status[attribute]) {
            setStatus(prev => ({ ...prev, [attribute]: false, [attr]: true }));
        } else {
            setStatus(prev => ({ ...prev, [attribute]: true, [attr]: false }));
        }
        return status;
    };

    return { status, setStatus, valueCheckbox };
};