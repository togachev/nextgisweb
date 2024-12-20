import { makeAutoObservable, runInAction } from "mobx";
import type { ReactElement } from "react";
import type { QueryParams } from "@nextgisweb/feature-layer/feature-grid/hook/useFeatureTable";
import type { FeatureLayerFieldRead } from "@nextgisweb/feature-layer/type/api";

export type SetValue<T> = ((prevValue: T) => T) | T;

interface Rnd {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Tab {
    key: string;
    label: string;
    children?: ReactElement;
}

export class FilterLayerStore {
    valueRnd: Rnd | null = null;
    styleOp: object;
    activeKey?: string | null = null;    
    activePanel?: boolean;
    queryParams: QueryParams | null = null;
    fields: FeatureLayerFieldRead[] = [];

    private _tabs: Tab[] = [];

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

    get tabs() {
        return this._tabs;
    }

    setActivePanel = (value: boolean) => {
        this.activePanel = value;
    };

    setActiveKey = (activeKey?: string) => {
        if (activeKey) {
            const exist = this._tabs.find((t) => t.key === activeKey);
            if (exist) {
                runInAction(() => {
                    this.activeKey = activeKey;
                });
            }
        }
    };

    setTabs = (tabs: Tab[]) => {
        this._tabs = tabs;
    };

    addTab = (tab: Tab): void => {
        const key = tab.key;
        if (!key) {
            throw new Error("You can not add a tab without the key");
        }
        const exist = this._tabs.find((t) => t.key === key);
        if (!exist) {
            this.setTabs([...this._tabs, tab]);
        }
        this.setActiveKey(key);
    };

    removeTab = (key: string): void => {
        const existIndex = this._tabs.findIndex((t) => t.key === key);
        if (existIndex !== -1) {
            const newTabs = [...this.tabs];
            newTabs.splice(existIndex, 1);
            if (newTabs.length) {
                const nearestTab =
                    newTabs[existIndex] || newTabs[existIndex - 1];
                if (nearestTab) {
                    this.setActiveKey(nearestTab.key);
                }
            }
            this.setTabs(newTabs);
        }
    };

    setValueRnd = (valueRnd: SetValue<Rnd | null>) => {
        this.setValue("valueRnd", valueRnd);
    };

    setStyleOp = (styleOp: SetValue<object | null>) => {
        this.setValue("styleOp", styleOp);
    };

    setQueryParams = (queryParams: SetValue<QueryParams | null>) => {
        this.setValue("queryParams", queryParams);
    };

    setFields = (fields: FeatureLayerFieldRead[]) => {
        this.fields = fields;
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