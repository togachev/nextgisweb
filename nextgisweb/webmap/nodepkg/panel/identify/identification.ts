import type { Attrs, FeatureItem } from "@nextgisweb/feature-layer/type";
import type { Display } from "@nextgisweb/webmap/display";

export interface FeatureHighlightEvent<F extends Attrs = Attrs> {
    geom: string | undefined;
    featureId: number;
    layerId: number;
    featureInfo: FeatureItem<F> & { labelWithLayer: string };
}

export interface LayerResponse {
    features: FeatureIdentify[];
    featureCount: number;
}

export type IdentifyResponse = Record<"featureCount", number> &
    Record<string, LayerResponse>;

export interface IdentifyInfo {
    response: IdentifyResponse;
    layerLabels: Record<string, string | null>;
    point: number[];
}



export interface RelationProps {
    external_resource_id: number;
    relation_key: string;
    relation_value: number;
}

export interface FeatureIdentify<F extends Attrs = Attrs> {
    id: number;
    layerId: number;
    label: string;
    fields: F;
    parent: string;
    relation: RelationProps;
}

export interface FeatureInfo {
    id: number;
    idx: number;
    value: string;
    label: string;
    layerId: number;
}

export interface FeatureSelectorProps {
    display: Display;
    featureInfo?: FeatureInfo;
    featureItem?: FeatureItem;
    featuresInfoList: FeatureInfo[];
    onFeatureChange: (featureInfoSelected: FeatureInfo | undefined) => void;
}

export interface IdentifyExtensionComponentProps<F extends Attrs = Attrs> {
    featureItem: FeatureItem<F>;
    resourceId: number;
}

export interface IdentifyResultProps {
    identifyInfo: IdentifyInfo;
    display: Display;
}

export interface FeatureEditButtonProps {
    display: Display;
    featureId: number;
    resourceId: number;
    onUpdate: () => void;
}
