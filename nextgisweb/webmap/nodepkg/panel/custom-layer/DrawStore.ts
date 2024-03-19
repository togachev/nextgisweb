import { makeAutoObservable } from "mobx";


export type SetValue<T> = ((prevValue: T) => T) | T;

export class DrawStore {
    drawLayer: string[] = [];
    switchKey: number[] = [];
    
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

    setDrawLayer = (drawLayer: SetValue<string[]>) => {
        this.setValue("drawLayer", drawLayer);
    };

    setSwitchKey = (switchKey: SetValue<number[]>) => {
        this.setValue("switchKey", switchKey);
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