import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface SourceMapsProps {
    update: boolean;
}
export interface SourceGroupProps {
    update: boolean;
}

export interface LayoutProps {
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
    idx: number;
    label: string;
    owner: boolean;
    position_map_group: LayoutProps;
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
    position_group: LayoutProps;
}

export class HomeStore {
    sourceMaps: SourceMapsProps; 
    sourceGroup: SourceGroupProps; 
    listMaps: ListMapProps[] = []; 
    groupMapsGrid: GroupMapsGridProps[] = [];
    itemsMapsGroup: ListMapProps[] = [];

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

    setSourceMaps = (sourceMaps: SetValue<string>) => {
        this.setValue("sourceMaps", sourceMaps);
    };

    setSourceGroup = (sourceGroup: SetValue<string>) => {
        this.setValue("sourceGroup", sourceGroup);
    };

    setListMaps = (listMaps: SetValue<string>) => {
        this.setValue("listMaps", listMaps);
    };

    setGroupMapsGrid = (groupMapsGrid: SetValue<string>) => {
        this.setValue("groupMapsGrid", groupMapsGrid);
    };

    setItemsMapsGroup = (itemsMapsGroup: SetValue<string>) => {
        this.setValue("itemsMapsGroup", itemsMapsGroup);
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