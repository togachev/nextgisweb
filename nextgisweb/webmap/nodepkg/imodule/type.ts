import { ReactElement } from "react";
import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
import type { Display } from "@nextgisweb/webmap/display";
import type { Attrs, FeatureItem } from "@nextgisweb/feature-layer/type";

import type { FormatNumberFieldData } from "@nextgisweb/feature-layer/fields-widget/FieldsStore";
import type { NgwAttributeType } from "@nextgisweb/feature-layer/type";

import { Store } from "../Store";

export interface RelationProps {
    external_resource_id?: number;
    relation_key?: string;
    relation_value?: number;
}

interface ResourceId {
    id: number;
}

export interface ResponseRaster {
    color_interpretation: string[];
    resource: ResourceId;
    values: number[];
}

export interface DataProps {
    id?: number;
    label?: string;
    layerId?: number;
    desc?: string;
    dop?: number;
    styleId?: number;
    value?: string;
    permission?: string;
    relation?: RelationProps;
    type: string;
    raster?: ResponseRaster;
}

export interface UrlParamsProps {
    lon?: number;
    lat?: number;
    attribute: string | boolean;
    st?: string;
    slf?: string;
    pn?: string;
}

export interface StylesRequest {
    id: number;
    label: string;
    dop: number;
}

export interface VisibleProps {
    hidden: boolean;
    overlay: number[] | undefined;
    key: string;
}

export interface ParamsProps {
    id: number;
    label: string;
    dop: number | null;
}

export interface EventProps {
    request: RequestProps | undefined;
    point: number[];
}

export type ExtensionsProps = Record<string, unknown | null>;

export interface Response {
    featureCount: number;
    data: DataProps[];
    point: number[];
}

export interface Rnd {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Visible {
    hidden: boolean;
    overlay: boolean | undefined;
    key: string;
}

export interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface Props {
    op: string;
    response: Response;
    position: Position;
    selected: DataProps;
}

export interface ContextProps {
    key: string;
    title: string;
    result: string;
    visible: boolean;
}

export interface Params {
    params: Props;
    visible: ({ hidden, overlay, key }: Visible) => void;
    display: Display;
    array_context: ContextProps[];
}

export type RequestProps = {
    srs: number;
    geom: string;
    styles: string[];
}

export type AxisProps = {
    x: number;
    y: number;
}

export type ContextItemProps = {
    label?: string;
    pointBorderColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    data: AxisProps[];
    labels: string[];
}

export type OptionProps = {
    children: ReactElement;
    hidden: boolean;
    key: string;
    label: ReactElement;
    title: string;
    value: string;
}

export type ContentProps = {
    display: Display;
    store: Store;
}

export type CoordinateProps = {
    display: Display;
    store: Store;
    count: number;
    op: string;
}

export type GraphPanelProps = {
    store: Store;
    item: DataProps;
}

export interface FeatureIdentify<F extends Attrs = Attrs> {
    id: number;
    layerId: number;
    label: string;
    fields: F;
    parent: string;
    relation: RelationProps;
}
export interface AttributeProps {
    attr: string;
    datatype: string;
    format_field: FormatNumberFieldData
    key: number;
    value: string;
}