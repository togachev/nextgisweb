import { makeAutoObservable } from "mobx";
import { TYPE_FILE } from "./constant";


export type SetValue<T> = ((prevValue: T) => T) | T;

export interface ControlProps {
    key: number | null;
    change: boolean;
}

export class DrawStore {
    options = TYPE_FILE.map(item => {
        return { value: item.value, label: item.label, disabled: item.disabled }
    });
    drawLayer: string[] = [];
    switchKey: ControlProps[] = [];
    readonly = true;
    itemModal: null = null;

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

    setItemModal = (itemModal: SetValue<string>) => {
        this.setValue("itemModal", itemModal);
    };

    setOptions = (options: SetValue<string[]>) => {
        this.setValue("options", options);
    };

    setDrawLayer = (drawLayer: SetValue<string[]>) => {
        this.setValue("drawLayer", drawLayer);
    };

    setSwitchKey = (switchKey: SetValue<string>) => {
        this.setValue("switchKey", switchKey);
    };

    setReadonly = (readonly: boolean) => {
        this.readonly = readonly;
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