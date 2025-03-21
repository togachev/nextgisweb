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
    colorBackground: string;
    colorText: string;
}

export interface FooterProps {
    services: ServicesProps;
    address: AddressProps;
    footer_name: FooterNameProps;
    logo: FooterLogoProps;
}

export interface UrlMenuProps {
    name: string;
    value: string;
}

export interface HeaderNamesProps {
    first_name: string;
    last_name: string;
}

export interface HeaderMenuProps {
    menu: UrlMenuProps[];
}

export interface HeaderProps {
    names: HeaderNamesProps;
    menus: HeaderMenuProps;
}

export class HomeStore {
    editFooter = true;
    widthMenu: number | string | null = null;
    editHeader = true;
    sourceMaps = false;
    sourceGroup = false;
    listMaps: ListMapProps[] = [];
    groupMapsGrid: GroupMapsGridProps[] = [];
    itemsMapsGroup: ListMapProps[] = [];
    valueFooter: FooterProps | null = null;
    valueHeader: HeaderProps | null = null;

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

    setEditFooter = (editFooter: boolean) => {
        this.editFooter = editFooter;
    };    
    
    setWidthMenu = (widthMenu: number | string) => {
        this.widthMenu = widthMenu;
    };

    setEditHeader = (editHeader: boolean) => {
        this.editHeader = editHeader;
    };

    setValueHeader = (valueHeader: SetValue<HeaderProps | null>) => {
        this.setValue("valueHeader", valueHeader);
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