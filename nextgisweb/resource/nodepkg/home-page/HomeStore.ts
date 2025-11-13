import { action, observable } from "mobx";
import { BaseAPIError, LunkwillParam, route, routeURL } from "@nextgisweb/pyramid/api";
import { extractError } from "@nextgisweb/gui/error";

import type { UploadFile } from "@nextgisweb/gui/antd";
import type { ApiError } from "@nextgisweb/gui/error/type";
import type {
    CompositeCreate,
    CompositeRead,
} from "@nextgisweb/resource/type/api";
import { errorModal } from "@nextgisweb/gui/error";

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
    update: boolean;
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

interface SetupProps {
    operation: string;
    cls: string;
    parent: number;
};

type Action = keyof Pick<HomeStore,
    | "getWidthMenu"
    | "getValuesHeader"
    | "getValuesFooter"
    | "saveSetting"
>;

export class HomeStore {
    @observable accessor widthMenu: number | string | null = null;
    @observable accessor sourceMaps = false;
    @observable accessor sourceGroup = false;
    @observable accessor editGroup = true;
    @observable accessor editMap = true;
    @observable accessor edit = true;
    @observable accessor update = false;

    @observable.shallow accessor resources: CompositeRead[] = [];
    @observable.shallow accessor allLoadedResources: Map<
        number,
        CompositeRead
    > = new Map();

    @observable.shallow accessor allMapsGroup: Map<
        number,
        ListMapProps
    > = new Map();

    @observable.ref accessor config: ConfigProps;
    @observable.ref accessor parent: number | null = null;

    @observable.shallow accessor itemsMapsGroup: ListMapProps[] = [];

    @observable.ref accessor activeMapId: string | null = null;
    @observable.ref accessor activeGroupId: number | null = 0;
    @observable.shallow accessor activeGroup: CompositeRead | null = null;
    @observable.shallow accessor initialFooter: FooterProps;
    @observable.shallow accessor initialHeader: HeaderProps;

    @observable.shallow accessor valueFooter: FooterProps;
    @observable.shallow accessor valueHeader: HeaderProps;

    @observable.shallow accessor errors: Partial<Record<Action, string>> = {};
    @observable.shallow accessor loading: Partial<Record<Action, boolean>> = {};
    @observable.shallow accessor setup: object = {};

    @observable.shallow accessor ulrImg: ImgUrlKey;

    constructor({ config }) {
        this.config = config
        this.getWidthMenu();
        this.mapgroup(true);
        this.getValuesHeader("loading");
        this.getValuesFooter("loading");
    };

    @action
    setSetup(setup: SetupProps) {
        this.setup = setup;
    }

    @action
    reload() {
        this.mapgroup(false);
    }

    @action
    setParent(parent: number | null) {
        this.parent = parent;
    }

    @action
    updateLoadedResources(resources: CompositeRead[]) {
        const allResources = new Map(this.allLoadedResources);

        resources.forEach((resource) => {
            allResources.set(resource.resource.id, resource);
        });
        this.allLoadedResources = allResources;
    }

    @action
    updateMapsGroup(itemsMapsGroup: ListMapProps[]) {
        const allMaps = new Map(this.allMapsGroup);

        itemsMapsGroup.forEach((item) => {
            allMaps.set(item.id, item);
        });
        this.allMapsGroup = allMaps;
    }


    @action
    setActiveMapId(activeMapId: string | null) {
        this.activeMapId = activeMapId;
    }

    @action
    setActiveGroupId(activeGroupId: number | null) {
        this.activeGroupId = activeGroupId;
    }

    @action
    setActiveGroup(activeGroup: CompositeRead | null) {
        this.activeGroup = activeGroup;
    }

    @action
    setResources(resources: CompositeRead[]) {
        this.resources = resources;
        this.updateLoadedResources(resources);
    }

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
    setEditGroup(editGroup: boolean): void {
        this.editGroup = editGroup;
    };

    @action
    setEditMap(editMap: boolean): void {
        this.editMap = editMap;
    };

    @action
    setEdit(edit: boolean): void {
        this.edit = edit;
    };

    @action
    setItemsMapsGroup(itemsMapsGroup: ListMapProps[]) {
        this.itemsMapsGroup = itemsMapsGroup
        this.updateMapsGroup(itemsMapsGroup);
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

    private async getFilterSetting(key, nkey, ekey) {
        const resp = await route("pyramid.csettings").get({
            query: { pyramid: [key], nkey: nkey, ekey: ekey },
            cache: true,
        });
        return resp;
    };

    async deleteGroup(id: number) {
        try {
            await route("resource.item", id).delete()
            this.reload()
        } catch (err) {
            errorModal(err);
            return;
        }
    };

    async deleteMap(id: number) {
        try {
            await route("mapgroup.item", this.activeGroupId).delete({
                json: { id: id },
            })
            this.reload()
        } catch (err) {
            errorModal(err);
            return;
        }
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

    private async mapgroup(reload: boolean) {
        const resp = await route("mapgroup.collection").get({
            query: {
                description: false,
            },
            cache: reload ? reload : false,
        });

        const { res, update, isAdministrator } = resp;

        this.setUpdate(isAdministrator ? isAdministrator : update)

        if (res.length > 0) {
            const activeResource = res
                .filter(item => item.mapgroup_resource.enabled)
                .reduce((min, current) => ((current.mapgroup_resource.position < min.mapgroup_resource.position) ? current : min));
            this.setActiveGroupId(activeResource.resource.id);
            this.setItemsMapsGroup(activeResource.mapgroup_group.groupmaps);
            this.setResources(res.sort((a, b) => (a.mapgroup_resource.position - b.mapgroup_resource.position)));
            this.setActiveGroup(activeResource)
        } else {
            this.setResources([])
            this.setItemsMapsGroup([]);
            this.setActiveGroup(null)
        }
    };

    async updatePosition(payload, route_name) {
        await route(route_name).post({
            json: payload,
        })
    };

    async createNewGroup(name: string): Promise<CompositeRead | undefined> {

        const payload: CompositeCreate = {
            resource: {
                display_name: name,
                keyname: null,
                parent: {
                    id: this.parent,
                },
                cls: "mapgroup_resource",
            },
        };

        try {
            const res = await route("resource.collection").post<{
                id: number;
            }>({
                json: payload,
            });
            this.reload();
            this.setActiveGroupId(res.id);

        } catch (err) {
            errorModal(err);
            return;
        }
    }

    async addMaps(ids: number[]): Promise<undefined> {
        try {
            await route("mapgroup.item", this.activeGroupId).put({
                json: {
                    ids: ids
                },
            });
            this.reload()
        } catch (err) {
            errorModal(err);
            return;
        }
    }
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