import { makeAutoObservable } from "mobx";
import type { UploadFile } from "@nextgisweb/gui/antd";
export type SetValue<T> = ((prevValue: T) => T) | T;

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

export interface UrlPhoneProps {
    name: string;
    value: string;
}

export interface ServicesProps {
    value: string;
    list: UrlPhoneProps[];
}

export interface AddressProps {
    value: string;
    phone: UrlPhoneProps[];
}

export interface FooterNameProps {
    base_year: string;
    name: string;
}

export interface FooterLogoProps {
    value: UploadFile[];
    colorLogo: string;
    colorBackground: string;
}

export interface FooterProps {
    services: ServicesProps;
    address: AddressProps;
    footer_name: FooterNameProps;
    logo: FooterLogoProps;
}

export class HomeStore {
    edit = true;
    sourceMaps = false;
    sourceGroup = false;
    listMaps: ListMapProps[] = [];
    groupMapsGrid: GroupMapsGridProps[] = [];
    itemsMapsGroup: ListMapProps[] = [];
    valueFooter: FooterProps | null = null;

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

    setEdit = (edit: boolean) => {
        this.edit = edit;
    };

    setValueFooter = (valueFooter: SetValue<FooterProps | null>) => {
        this.setValue("valueFooter", valueFooter);
    };

    setSourceMaps = (sourceMaps: boolean) => {
        this.sourceMaps = sourceMaps;
    };

    setSourceGroup = (sourceGroup: boolean) => {
        this.sourceGroup = sourceGroup;
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