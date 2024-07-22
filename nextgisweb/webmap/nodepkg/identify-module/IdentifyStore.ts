import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;

export interface DataProps {
    id: number;
    layerId: number;
    styleId: number;
    label: string;
    value: number;
    desc: string;
}

interface Rnd {
    x: number;
    y: number;
    width: number;
    height: number;
}

export class IdentifyStore {
    layerName: string | null = null;
    data: DataProps[] = [];
    selected: DataProps | null = null;
    attribute: object | null = null;
    updateContent: boolean;
    update = false;
    fullscreen = false;
    contextUrl: string | null = null;
    linkToGeometry: string | null = null;
    valueRnd: Rnd | null = null;

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

    setValueRnd = (valueRnd: SetValue<Rnd | null>) => {
        this.setValue("valueRnd", valueRnd);
    };  

    setLayerName = (layerName: SetValue<string | null>) => {
        this.setValue("layerName", layerName);
    };

    setData = (data: DataProps[]) => {
        this.data = data;
    };

    setSelected = (selected: SetValue<DataProps | null>) => {
        this.setValue("selected", selected);
    };

    setAttribute = (attribute: SetValue<object | null>) => {
        this.setValue("attribute", attribute);
    };

    setUpdate = (update: boolean) => {
        this.setValue("update", update);
    };

    setUpdateContent = (updateContent: boolean) => {
        this.updateContent = updateContent;
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