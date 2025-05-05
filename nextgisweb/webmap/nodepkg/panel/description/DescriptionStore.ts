import { action, observable } from "mobx";

import { PanelStore } from "..";
import type { PanelStoreConstructorOptions } from "../PanelStore";
interface DescProps {
    description?: string;
    type?: string;
}
export default class DescriptionStore extends PanelStore {
    @observable.ref accessor content: string | string[] | null = null;

    constructor({ plugin, display }: PanelStoreConstructorOptions) {
        super({ plugin, display });
    }

    @action
    setContent(value: string | string[] | null) {
        this.content = value;
    }
}
