import { action, observable } from "mobx";
import { route } from "@nextgisweb/pyramid/api";
import { GroupMapsGridProps } from "@nextgisweb/resource/home-page/HomeStore";
import { errorModal } from "@nextgisweb/gui/error";
import type {
    CompositeCreate,
    CompositeRead,
} from "@nextgisweb/resource/type/api";

export class Store {
    @observable accessor update = false;

    @observable.ref accessor maps: number[] = [];
    @observable.ref accessor parent: number | null = null;
    @observable.shallow accessor groups: GroupMapsGridProps[] = [];

    constructor() {
        this.groupsMaps(false);
    };

    @action
    setMaps(maps: number[]) {
        this.maps = maps;
    }

    @action
    setParent(parent: number | null) {
        this.parent = parent;
    }

    @action
    setGroups(groups: GroupMapsGridProps[]) {
        this.groups = groups;
    }

    @action
    setUpdate(update: boolean) {
        this.update = update;
    };

    private async groupsMaps(reload: boolean) {
        const resp = await route("mapgroup.collection").get({
            query: {
                description: false,
            },
            cache: reload ? reload : false,
        });

        const { res, update } = resp;
        this.setGroups(res.sort((a, b) => (a.mapgroup_resource.position - b.mapgroup_resource.position)));
        this.setUpdate(update);
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
            await route("resource.collection").post<{
                id: number;
            }>({
                json: payload,
            });
            this.groupsMaps(true)
        } catch (err) {
            errorModal(err);
            return;
        }
    }

    async addMaps(resourceId: number, ids: number[]): Promise<undefined> {
        let payload = { params: [] };
        ids.map(item => {
            payload.params.push({ id: item, position: 0 })
        })
        console.log(payload);

        // try {
        //     await route("mapgroup.maps").post<{
        //         resourceId: number;
        //     }>({
        //         json: payload,
        //     });
        // } catch (err) {
        //     errorModal(err);
        //     return;
        // }
    }
};
