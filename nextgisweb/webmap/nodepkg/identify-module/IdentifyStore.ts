import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface SelectedProps {
    id: number;
    layerId: number;
    styleId: number;
    label: string;
    value: number;
    layer_name: string;
}

export class IdentifyStore {

    selected: SelectedProps | null = null;
    styleContent = true;

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

    setSelected = (selected: SetValue<SelectedProps | null>) => {
        this.setValue("selected", selected);
    };

    setStyleContent = (styleContent: boolean) => {
        this.setValue("styleContent", styleContent);
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