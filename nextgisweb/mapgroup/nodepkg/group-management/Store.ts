import { action, observable } from "mobx";
import { route } from "@nextgisweb/pyramid/api";
import { GroupMapsGridProps } from "@nextgisweb/resource/home-page/HomeStore";


export class Store {
    @observable accessor update = false;

    @observable.shallow accessor groups: GroupMapsGridProps[] = [];

    constructor() {
        this.groupsMaps();
    };

    @action
    setGroups(groups: GroupMapsGridProps[]) {
        this.groups = groups;
    }

    @action
    setUpdate(update: boolean) {
        this.update = update;
    };

    private async groupsMaps() {
        const resp = await route("mapgroup.collection").get({
            query: {
                description: false,
            },
            cache: true,
        });

        const { res, update } = resp;
        this.setGroups(res.sort((a, b) => (a.mapgroup_resource.position - b.mapgroup_resource.position)));
        this.setUpdate(update);
    };
};
