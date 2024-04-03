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

export type InfoUpload = {
    uid: string;
    name: string;
}

export type SourceType = {
    id: number;
    url: string;
    format: string;
    file: InfoUpload;
    length: number;
};

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

export type ParamsFormat = {
    value: string;
    label: string;
    disabled: boolean;
};