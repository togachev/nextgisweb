import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface StateProps {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class IdentifyStore {
    valueRnd: StateProps = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    };

    selected: object;

    constructor({ selected, ...props }) {
        this.selected = selected;
        for (const key in props) {
            const k = key;
            const prop = (props)[k];
            if (prop !== undefined) {
                Object.assign(this, { [k]: prop });
            }
        }

        makeAutoObservable(this, {});
    }

    setValueRnd = (valueRnd: SetValue<StateProps>) => {
        this.setValue("valueRnd", valueRnd);
    };

    setSelected = (selected: object) => {
        this.selected = selected;
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