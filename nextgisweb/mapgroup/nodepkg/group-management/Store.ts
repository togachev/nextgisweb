import { action, observable } from "mobx";
import { route } from "@nextgisweb/pyramid/api";
import { GroupMapsGridProps } from "@nextgisweb/resource/home-page/HomeStore";
import { errorModal } from "@nextgisweb/gui/error";
import type {
    CompositeCreate,
    CompositeRead,
} from "@nextgisweb/resource/type/api";

export class Store {
    @observable accessor deleteTag = false;

    @observable.ref accessor maps: number[] = [];
    @observable.ref accessor parent: number | null = null;
    @observable.shallow accessor groups: GroupMapsGridProps[] = [];

    @observable.shallow accessor allLoadedGroups: Map<
        number,
        CompositeRead
    > = new Map();

    constructor() {
        this.groupsMaps(true);
    };

    @action
    reload() {
        this.groupsMaps(false);
    }


    @action
    loadedGroups(groups: CompositeRead[]) {
        const allGroups = new Map(this.allLoadedGroups);

        groups.forEach((group) => {
            allGroups.set(group.resource.id, group);
        });
        this.allLoadedGroups = allGroups;
    }

    @action
    setGroups(groups: GroupMapsGridProps[]) {
        this.groups = groups;
        this.loadedGroups(groups);
    }

    @action
    setDeleteTag(deleteTag: boolean) {
        this.deleteTag = deleteTag;
    }

    @action
    setMaps(maps: number[]) {
        this.maps = maps;
    }

    @action
    setParent(parent: number | null) {
        this.parent = parent;
    }

    async groupsMaps(reload: boolean) {
        const resp = await route("mapgroup.collection").get({
            query: {
                description: false,
            },
            cache: reload ? reload : false,
        });

        const { res } = resp;
        if (res.length > 0) {
            this.setGroups(res.sort((a, b) => (a.mapgroup_resource.position - b.mapgroup_resource.position)));
        } else {
            this.setGroups([])
        }
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
            this.reload()
        } catch (err) {
            errorModal(err);
            return;
        }
    }

    async addMaps(resourceId: number, ids: number[]): Promise<undefined> {
        const payload = { params: [] };
        ids.map(item => {
            payload.params.push({ id: item, position: 0 })
        })
        console.log(payload);
    }
};
