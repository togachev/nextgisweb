import { makeAutoObservable } from "mobx";
export type SetValue<T> = ((prevValue: T) => T) | T;
import type { FeatureLayerFieldRead } from "@nextgisweb/feature-layer/type/api";

export class FilterByDataStore {
    fields_: FeatureLayerFieldRead[] | null = null;

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