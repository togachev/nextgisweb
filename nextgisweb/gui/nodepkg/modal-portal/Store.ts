import { makeAutoObservable } from "mobx";
import { RefObject } from "react";

export type SetValue<T> = ((prevValue: T) => T) | T;

export class Store {
    scale: number | null = null;
    rotate: number | null = null;
    refImg: RefObject;

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

    setScale = (scale: SetValue<number | null>) => {
        this.setValue("scale", scale);
    };

    setRotate = (rotate: SetValue<number | null>) => {
        this.setValue("rotate", rotate);
    };

    setRefImg = (refImg: SetValue<RefObject | null>) => {
        this.setValue("refImg", refImg);
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