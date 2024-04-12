import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;


export class DiagramStore {
    selected: object = {};
    result: object = {};

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

    setSelected = (selected: SetValue<object>) => {
        this.setValue("selected", selected);
    };

    setResult = (result: SetValue<object>) => {
        this.setValue("result", result);
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