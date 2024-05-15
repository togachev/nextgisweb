import { makeAutoObservable } from "mobx";
import { RefObject } from "react";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface DataProps {
    id: number;
    layerId: number;
    styleId: number;
    label: string;
    value: number;
    layer_name: string;
}

export class IdentifyStore {
    layerName: string | null = null;
    data: DataProps[] = [];
    selected: DataProps | null = null;
    attribute: object | null = null;
    feature: object | null = null;
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

    setLayerName = (layerName: SetValue<string | null>) => {
        this.setValue("layerName", layerName);
    };

    setData = (data: DataProps[]) => {
        this.data = data;
    };

    setSelected = (selected: DataProps) => {
        this.selected = selected;
    };

    setAttribute = (attribute: SetValue<object | null>) => {
        this.setValue("attribute", attribute);
    };

    setFeature = (feature: SetValue<object | null>) => {
        this.setValue("feature", feature);
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