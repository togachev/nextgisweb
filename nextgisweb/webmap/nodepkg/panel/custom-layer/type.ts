export type FeatureContext = {
    name: string;
    value: any;
}

export type ItemType = {
    key: number;
    change: boolean;
    label: string;
    geomType: string;
    allLayer: boolean;
    edge: boolean;
    vertex: boolean;
    draw: boolean;
    modify: boolean;
};

export type ItemProps = {
    item: ItemType;
}