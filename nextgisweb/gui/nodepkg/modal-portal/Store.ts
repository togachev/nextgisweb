import { makeAutoObservable } from "mobx";

export type SetValue<T> = ((prevValue: T) => T) | T;


type TransformProps = {
    rotate: number;
    rotateX: number;
    rotateY: number;
};

type ImageProps = {
    scale: number;
    transform: TransformProps;
};

export class Store {
    rotate: number | null = null;
    propsImage: ImageProps;

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

    setPropsImage = (propsImage: SetValue<ImageProps | null>) => {
        this.setValue("propsImage", propsImage);
    };

    setRotate = (rotate: SetValue<number | null>) => {
        this.setValue("rotate", rotate);
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