import { makeAutoObservable } from "mobx";

export interface AttrProps {
    response?: string;
}

export interface ResponseProps {
    response?: string;
}

class IdentifyStore {
    attrFeature = {
        response: undefined,
    };

    constructor() {
        makeAutoObservable(this);
    }

    setAttrFeature(response): void {
        this.attrFeature = { response };
    }

}

export const identifyStore = new IdentifyStore();