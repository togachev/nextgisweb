import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface SourceProps {
    coeff: number;
    width: string;
    minWidth: string;
}

export interface GroupMapsProps {
    key: number;
    label: string;
    type: string;
}

export interface MapProps {
    i: string;
    x: number;
    y: number;
    w: number;
    h: number;
    static: boolean;
}

export interface GroupProps {
    i: string;
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

export interface GroupMapsGridProps {
    id: number;
    webmap_group_name: string;
    action_map: boolean;
    position_group: GroupProps;
}

export class HomeStore {
    staticPosition = true;
    source: SourceProps; // список карт
    listMaps: ListMapProps[] = []; // список карт
    groupMaps: GroupMapsProps[] = []; // группы карт
    groupMapsGrid: GroupMapsGridProps[] = []; // группы карт
    itemsMapsGroup: ListMapProps[] = []; // группы карт
    layout: MapProps[] = [];
    defaultValueMenu: string;

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

    setDefaultValueMenu = (defaultValueMenu: SetValue<string>) => {
        this.setValue("defaultValueMenu", defaultValueMenu);
    };

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

    setGroupMapsGrid = (groupMapsGrid: SetValue<string>) => {
        this.setValue("groupMapsGrid", groupMapsGrid);
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