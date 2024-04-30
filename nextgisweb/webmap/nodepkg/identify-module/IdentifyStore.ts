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

    constructor() {
        makeAutoObservable(this);
    }

    setValueRnd = (valueRnd: SetValue<StateProps>) => {
        this.setValue("valueRnd", valueRnd);
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