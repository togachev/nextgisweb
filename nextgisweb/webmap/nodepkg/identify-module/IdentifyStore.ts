import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;
import type { DataProps, Rnd } from "./type";

export class IdentifyStore {
    layerName: string | null = null;
    data: DataProps[] = [];
    selected: DataProps | null = null;
    attribute: object | null = null;
    extensions: object | null = null;
    updateContent = false;
    update = false;
    fullscreen = false;
    contextUrl: string | null = null;
    fixContentItem: string | null = null;
    linkToGeometry: string | null = null;
    valueRnd: Rnd | null = null;
    fixPos: Rnd | null = null;
    fixPanel: string | null = null;
    fixPopup = false;

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
    
    setFixPos = (fixPos: SetValue<Rnd | null>) => {
        this.setValue("fixPos", fixPos);
    };

    setFixPanel = (fixPanel: SetValue<string | null>) => {
        this.setValue("fixPanel", fixPanel);
    };

    setFixPopup = (fixPopup: boolean) => {
        this.fixPopup = fixPopup;
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

    setExtensions = (extensions: SetValue<object | null>) => {
        this.setValue("extensions", extensions);
    };

    setUpdate = (update: boolean) => {
        this.update = update;
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

    setFixContentItem = (fixContentItem: SetValue<string | null>) => {
        this.setValue("fixContentItem", fixContentItem);
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