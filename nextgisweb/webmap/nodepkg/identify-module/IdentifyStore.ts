import { makeAutoObservable } from "mobx";

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
    selected: string | null = null;
    attribute: object | null = null;
    feature: object | null = null;
    update = false;
    fullscreen = false;
    contextUrl: string | null = null;
    linkToGeometry: string | null = null;

    constructor({ data, ...props }) {
        this.data = data
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

    setSelected = (selected: SetValue<string | null>) => {
        this.setValue("selected", selected);
    };

    setAttribute = (attribute: SetValue<object | null>) => {
        this.setValue("attribute", attribute);
    };

    setFeature = (feature: SetValue<object | null>) => {
        this.setValue("feature", feature);
    };

    setUpdate = (update: boolean) => {
        this.setValue("update", update);
    };

    setFullscreen = (fullscreen: boolean) => {
        this.fullscreen = fullscreen;
    };

    setContextUrl = (contextUrl: SetValue<string | null>) => {
        this.setValue("contextUrl", contextUrl);
    };

    setLinkToGeometry = (linkToGeometry: SetValue<string | null>) => {
        this.setValue("linkToGeometry", linkToGeometry);
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