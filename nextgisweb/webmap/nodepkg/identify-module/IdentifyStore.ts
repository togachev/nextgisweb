import { makeAutoObservable } from "mobx";

export interface SelectedProps {
    id: number;
    layerId: number;
    styleId: number;
    label: string;
    value: number;
    layer_name: string;
}

export class IdentifyStore {

    selected: SelectedProps;

    constructor({ selected, ...props }) {
        this.selected = selected;
        for (const key in props) {
            const k = key;
            const prop = (props)[k];
            if (prop !== undefined) {
                Object.assign(this, { [k]: prop });
            }
        }

        makeAutoObservable(this, {});
    }

    setSelected = (selected: SelectedProps) => {
        this.selected = selected;
    };

}