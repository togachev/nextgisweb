import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;


export class LayerOrderSettingsStore {
    layerName: string | null = null;


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

    setLayerName = (layerName: SetValue<string | null>) => {
        this.setValue("layerName", layerName);
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