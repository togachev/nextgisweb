import { action, observable } from "mobx";
import { route, routeURL } from "@nextgisweb/pyramid/api";
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
    enabled: boolean;
    display_name: string;
    id: number;
    idx: number;
    label: string;
    owner: boolean;
    position: LayoutProps;
    preview_description: string;
    preview_fileobj_id: number;
    value: number;
    webmap_group_id: number;
    webmap_group_name: string;
};

export interface GroupMapsGridProps {
    id: number;
    webmap_group_name: string;
    enabled: boolean;
    position: LayoutProps;
};

export interface UrlPhoneProps {
    name: string;
    value: string;
};

export interface FooterProps {
    service: UrlPhoneProps[];
    service_name: string;
    address_phone: UrlPhoneProps[];
    address_name: string;
    footer_name: string;
    base_year: string;
    img: UploadFile[];
    colorBackground: string;
    colorText: string;
    colorTextMenu: string;
};

export interface UrlMenuProps {
    name: string;
    value: string;
};

export interface HeaderProps {
    first_name: string;
    last_name: string;
    menu: UrlMenuProps[];
    img: UploadFile[];
};

interface ConfigProps {
    isAdministrator: boolean;
    type: string;
    upath_info: string[];
};

interface ImgUrlKey {
    header: string;
    footer: string;
};

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
    @observable accessor edit = false;
    @observable accessor update = false;

    @observable.ref accessor config: ConfigProps;

    @observable.shallow accessor listMaps: ListMapProps[] = [];
    @observable.shallow accessor groupMapsGrid: GroupMapsGridProps[] = [];
    @observable.shallow accessor itemsMapsGroup: ListMapProps[] = [];

    @observable.shallow accessor initialFooter: FooterProps;
    @observable.shallow accessor initialHeader: HeaderProps;

    @observable.shallow accessor valueFooter: FooterProps;
    @observable.shallow accessor valueHeader: HeaderProps;

    @observable.shallow accessor errors: Partial<Record<Action, string>> = {};
    @observable.shallow accessor loading: Partial<Record<Action, boolean>> = {};

    @observable.shallow accessor ulrImg: ImgUrlKey;

    constructor({ config }) {
        this.config = config
        this.getWidthMenu();
        this.getMapValues("all");
        this.getValuesHeader("loading");
        this.getValuesFooter("loading");
    };

    @action
    setUrlImg(ulrImg: ImgUrlKey) {
        this.ulrImg = ulrImg;
    };

    @action
    setUpdate(update: boolean) {
        this.update = update;
    };

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
    setEdit(edit: boolean): void {
        this.edit = edit;
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
    };

    @action
    setError(operation: Action, msg?: string) {
        this.errors[operation] = msg;
    };

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
        const width = window.innerWidth < 760 ? window.innerWidth - window.innerWidth / 100 * 20 - 328 : 280;
        this.setWidthMenu(width);
    };

    @actionHandler
    updateStatusFile(status, nameArray, stateInitial, state, setState) {
        if (this[stateInitial]?.[nameArray]?.length > 0) {
            const val = [...this[stateInitial][nameArray]]
            val.map(item => item.status = status)
            const value = {
                ...this[state],
                [nameArray]: val,
            };
            this[setState](value);

        } else {
            const value = {
                ...this[state],
                [nameArray]: [],
            };
            this[setState](value);
        }
    };

    @actionHandler
    async saveSetting(value, key) {
        const payload = Object.fromEntries(
            Object.entries(value || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { pyramid: { [key]: payload } },
        });
    };

    private async maplist() {
        const resp = await route("mapgroup.maps").get();
        return resp;
    };

    private async groupMaps() {
        const resp = await route("mapgroup.groups").get();
        return resp;
    };

    private async getFilterSetting(key, nkey, ekey) {
        const resp = await route("pyramid.csettings").get({
            query: { pyramid: [key], nkey: nkey, ekey: ekey },
            cache: true,
        });
        return resp;
    };

    @actionHandler
    async getValuesHeader(status: string) {
        this.getFilterSetting("home_page_header", "", "")
            .then((data) => {
                if (data.pyramid) {
                    if (Object.keys(data.pyramid.home_page_header).length > 0) {

                        if (data.pyramid.home_page_header?.img && data.pyramid.home_page_header?.img[0]?.status === "done") {
                            data.pyramid.home_page_header.img[0].route = true;
                            this.setUrlImg({ ...this.ulrImg, header: routeURL("pyramid.asset.himg", { ikey: "home_page_header" }) });
                        }

                        this.setValueHeader(data.pyramid.home_page_header);

                        if (status === "loading") {
                            this.setInitialHeader(data.pyramid.home_page_header);
                        }
                    }
                }
            })
    };

    @actionHandler
    async getValuesFooter(status: string) {
        this.getFilterSetting("home_page_footer", "", "")
            .then((data) => {
                if (data.pyramid) {
                    if (Object.keys(data.pyramid.home_page_footer).length > 0) {

                        if (data.pyramid.home_page_footer?.img && data.pyramid.home_page_footer?.img[0]?.status === "done") {
                            data.pyramid.home_page_footer.img[0].route = true;
                            this.setUrlImg({ ...this.ulrImg, footer: routeURL("pyramid.asset.himg", { ikey: "home_page_footer" }) });
                        }

                        this.setValueFooter(data.pyramid.home_page_footer);

                        if (status === "loading") {
                            this.setInitialFooter(data.pyramid.home_page_footer);
                        }
                    }
                }
            });
    };

    @actionHandler
    async getMapValues(key) {
        this.maplist()
            .then(maps => {
                this.setListMaps(maps);
                if (key === "all") {
                    this.groupMaps()
                        .then(group => {
                            this.setGroupMapsGrid(group.sort((a, b) => a.position - b.position));
                            this.setItemsMapsGroup(maps.filter(u => u.webmap_group_id === group[0]?.id).sort((a, b) => a.position - b.position));
                            if (this.groupMapsGrid.length > 0 && this.itemsMapsGroup.length > 0) {
                                this.setUpdate(true)
                            } else {
                                this.setUpdate(false)
                            }
                        })
                }
            });
    };

    async updatePosition(payload, route_name) {
        await payload.map(item =>
             route(route_name).post({
                json: item,
            })
        )
    };
};

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
};