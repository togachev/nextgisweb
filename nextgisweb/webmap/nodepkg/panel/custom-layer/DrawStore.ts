import { action, observable } from "mobx";

export interface ControlProps {
    key: number | null;
    change: boolean;
}

interface OptionProps {
    value: string;
    label: string;
    disabled: boolean;
}

export class DrawStore {
    @observable.shallow accessor options: OptionProps[] = [];
    @observable.shallow accessor drawLayer: string[] = [];
    @observable.shallow accessor checkedKey: ControlProps[] = [];
    @observable.ref accessor readonly: boolean = true;
    @observable.ref accessor itemModal: string | null = null;

    constructor({options, ...props }) {
        this.options = options;
        for (const key in props) {
            const k = key;
            const prop = (props)[k];
            if (prop !== undefined) {
                Object.assign(this, { [k]: prop });
            }
        }
    }

    @action
    setItemModal(itemModal: string) {
        this.itemModal = itemModal;
    };

    @action
    setOptions(options: OptionProps[]){
        this.options = options;
    };

    @action
    setDrawLayer (drawLayer: string[]) {
        this.drawLayer = drawLayer;
    };

    @action
    setCheckedKey (checkedKey: ControlProps[]) {
        this.checkedKey = checkedKey;
    };

    @action
    setReadonly(readonly: boolean) {
        this.readonly = readonly;
    };
}