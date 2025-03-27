import { action, observable } from "mobx";
import { route } from "@nextgisweb/pyramid/api";
import { extractError } from "@nextgisweb/gui/error";

import type { UploadFile } from "@nextgisweb/gui/antd";
import type { ApiError } from "@nextgisweb/gui/error/type";

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
    file: UploadFile[];
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

export interface HeaderProps {
    first_name: string;
    last_name: string;
    menu: UrlMenuProps[];
}

type Action = keyof Pick<HomeStore,
    | "getWidthMenu"
    | "getMapValues"
    | "getValuesHeader"
    | "getValuesFooter"
    | "saveSetting"
>;

export class HomeStore {
    @observable accessor widthMenu: number | string | null = null;
    @observable accessor sourceMaps = false;
    @observable accessor sourceGroup = false;

    @observable.shallow accessor listMaps: ListMapProps[] = [];
    @observable.shallow accessor groupMapsGrid: GroupMapsGridProps[] = [];
    @observable.shallow accessor itemsMapsGroup: ListMapProps[] = [];


    @observable.shallow accessor initialFooter: FooterProps;
    @observable.shallow accessor initialHeader: HeaderProps;

    @observable.shallow accessor valueFooter: FooterProps;
    @observable.shallow accessor valueHeader: HeaderProps;

    @observable.shallow accessor errors: Partial<Record<Action, string>> = {};
    @observable.shallow accessor loading: Partial<Record<Action, boolean>> = {};

    constructor() {
        this.getWidthMenu();
        this.getMapValues("all");
        this.getValuesHeader("loading");
        this.getValuesFooter("loading");
    }

    @action
    setWidthMenu(width: number | string) {
        this.widthMenu = width;
    };

    @action
    setSourceMaps(sourceMaps: boolean): void {
        this.sourceMaps = sourceMaps;
    };

    @action
    setSourceGroup(sourceGroup: boolean): void {
        this.sourceGroup = sourceGroup;
    };

    @action
    setListMaps(listMaps: ListMapProps[]) {
        this.listMaps = listMaps
    };

    @action
    setGroupMapsGrid(groupMapsGrid: GroupMapsGridProps[]) {
        this.groupMapsGrid = groupMapsGrid
    };

    @action
    setItemsMapsGroup(itemsMapsGroup: ListMapProps[]) {
        this.itemsMapsGroup = itemsMapsGroup
    };

    @action
    setLoading(operation: Action, status: boolean) {
        this.loading = { ...this.loading, [operation]: status };
    }

    @action
    setError(operation: Action, msg?: string) {
        this.errors[operation] = msg;
    }

    @action
    setValueHeader(valueHeader: HeaderProps) {
        this.valueHeader = valueHeader;
    };

    @action
    setValueFooter(valueFooter: FooterProps) {
        this.valueFooter = valueFooter;
    };

    @action
    setInitialHeader(initialHeader: HeaderProps) {
        this.initialHeader = initialHeader;
    };

    @action
    setInitialFooter(initialFooter: FooterProps) {
        this.initialFooter = initialFooter;
    };

    @actionHandler
    getWidthMenu() {
        const width = window.innerWidth < 785 ? "100%" : 300;
        this.setWidthMenu(width);
    }

    @actionHandler
    async saveSetting(value, key) {
        const payload = Object.fromEntries(
            Object.entries(value || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { pyramid: { [key]: payload } },
        });
    }

    private async getPermission(id: number) {
        const resp = await route("resource.permission", id).get({
            cache: true,
        });
        return resp;
    }

    private async maplist() {
        const resp = await route("resource.maplist").get();
        return resp.result;
    }

    private async groupMaps() {
        const resp = await route("resource.mapgroup").get();
        return resp;
    }

    private async getSetting(key) {
        const resp = await route("pyramid.csettings").get({
            query: { pyramid: [key] }
        });
        return resp;
    }

    @actionHandler
    async getValuesHeader(status: string) {
        this.getSetting("home_page_header")
            .then((data) => {
                if (data.pyramid) {
                    if (Object.keys(data.pyramid.home_page_header).length > 0) {
                        this.setValueHeader(data.pyramid.home_page_header);
                        status === "loading" && this.setInitialHeader(data.pyramid.home_page_header);
                    }
                }
            })
    }

    @actionHandler
    async getValuesFooter(status: string) {
        this.getSetting("home_page_footer")
            .then((data) => {
                if (data.pyramid) {
                    if (Object.keys(data.pyramid.home_page_footer).length > 0) {
                        this.setValueFooter(data.pyramid.home_page_footer);
                        status === "loading" && this.setInitialFooter(data.pyramid.home_page_footer);
                    }
                }
            })
    }

    @actionHandler
    async getMapValues(key) {
        this.maplist()
            .then(maps => {
                this.setListMaps(maps);
                if (key === "all") {
                    this.groupMaps()
                        .then(group => {
                            const maps_filter = maps.filter(item => item.action_map === true);
                            const result = group.filter(({ id }) => [...new Set(maps_filter.map(g => g.webmap_group_id))].includes(id));
                            this.setGroupMapsGrid(result.sort((a, b) => a.id_pos - b.id_pos));
                            const groupId = result.sort((a, b) => a.id_pos - b.id_pos)[0]?.id
                            this.setItemsMapsGroup(maps_filter.filter(u => u.webmap_group_id === groupId).sort((a, b) => a.id_pos - b.id_pos));
                        })
                }
            });
    }
}

export function actionHandler(
    originalMethod: any,
    _context: ClassMethodDecoratorContext
) {
    return async function (
        this: HomeStore,
        ...args: any[]
    ): Promise<any> {
        const operationName = originalMethod.name || "operation";
        this.setLoading(operationName, true);

        try {
            const result = await originalMethod.apply(this, args);
            return result;
        } catch (er) {
            const { title } = extractError(er as ApiError);
            this.setError(operationName, title);
            throw er;
        } finally {
            this.setLoading(operationName, false);
        }
    };
}