import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface SourceProps {
    coeff: number;
    width: string;
}

export interface GroupMapProps {
    key: number;
    label: string;
    type: string;
}

export interface MapProps {
    res_id: number;
    wmg: number;
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    static: boolean;
}

export interface ListMapProps {
    action_map: boolean;
    display_name: string;
    id: number;
    label: string;
    owner: boolean;
    position_map_group: MapProps;
    preview_description: string;
    preview_fileobj_id: number;
    value: number;
    webmap_group_id: number;
    webmap_group_name: string;
}

export class HomeStore {
    staticPosition = true;
    source: SourceProps; // список карт
    listMaps: ListMapProps[] = []; // список карт
    groupMaps: GroupMapProps[] = []; // группы карт
    itemsMapsGroup: ListMapProps[] = []; // группы карт
    layout: MapProps[] = [];

    constructor({ ...props }) {
        for (const key in props) {
            const k = key;
            const prop = (props)[k];
            if (prop !== undefined) {
                Object.assign(this, { [k]: prop });
            }
        }

        makeAutoObservable(this, {});
    }

    setStaticPosition = (staticPosition: boolean) => {
        this.staticPosition = staticPosition;
    };

    setSource = (source: SetValue<string>) => {
        this.setValue("source", source);
    };

    setListMaps = (listMaps: SetValue<string>) => {
        this.setValue("listMaps", listMaps);
    };

    setGroupMaps = (groupMaps: SetValue<string>) => {
        this.setValue("groupMaps", groupMaps);
    };

    setItemsMapsGroup = (itemsMapsGroup: SetValue<string>) => {
        this.setValue("itemsMapsGroup", itemsMapsGroup);
    };

    setlayout = (layout: SetValue<string>) => {
        this.setValue("layout", layout);
    };

    private setValue<T>(property: keyof this, valueOrUpdater: SetValue<T>) {
        const isUpdaterFunction = (
            input: unknown
        ): input is (prevValue: T) => T => {
            return typeof input === "function";
        };

        const newValue = isUpdaterFunction(valueOrUpdater)
            ? valueOrUpdater(this[property] as T)
            : valueOrUpdater;

        Object.assign(this, { [property]: newValue });
    }
}