import { ReactElement } from "react";
import type { Attrs } from "@nextgisweb/feature-layer/type";
import type { FormatNumberFieldData } from "@nextgisweb/feature-layer/fields-widget/FieldsStore";
import type { Display } from "@nextgisweb/webmap/display";
import { PopupStore } from "./PopupStore";
import { MapBrowserEvent } from "ol";
export type ExtensionsProps = Record<string, unknown | null>;

export type CoordinateProps = {
    display: Display;
    store: PopupStore;
    count: number;
    op: string;
    point?: boolean;
}

export type AxisProps = {
    x: number;
    y: number;
}

export type GraphPanelProps = {
    store: PopupStore;
    item: DataProps;
}

export type ContextItemProps = {
    label?: string;
    pointBorderColor?: string;
    backgroundColor?: string;
    borderColor?: string;
    data: AxisProps[];
    labels: string[];
}

export interface UrlParamsProps {
    lon?: number;
    lat?: number;
    attribute: string | boolean;
    st?: string;
    slf?: string;
    pn?: string;
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
    store: PopupStore;
    checked?: boolean;
}

export type SizeWindowProps = {
    width: number;
    height: number;
}

export type SourceProps = {
    typeEvents: string;
    pixel: number[];
    clientPixel: number[];
    coordinate: number[];
    lonlat: number[];
}

export type PointClickProps = {
    x: number;
    y: number;
    pos?: string;
}

export type ButtonZoomProps = {
    topLeft?: boolean;
    topRight?: boolean;
    bottomLeft?: boolean;
    bottomRight?: boolean;
}

export type Rnd = {
    x: number;
    y: number;
    width: number;
    height: number;
    pointClick: PointClickProps;
    buttonZoom: ButtonZoomProps
}

export type VisibleProps = {
    hidden: boolean;
    overlay: number[] | undefined;
    key: string;
}

export type StylesRequest = {
    id: number;
    label: string;
    dop: number;
}

export interface ParamsProps {
    id: number;
    label: string | undefined;
    dop: number | null;
}

export interface ValueProps {
    attribute: boolean;
    pn: boolean;
    lon: number;
    lat: boolean;
    params: ParamsProps;
    selected: string;
}

export interface ResponseContextProps {
    point: boolean;
    value: ValueProps;
    coordinate: number[]
}


export type RequestProps = {
    srs: number;
    geom: string;
    styles: StylesRequest[];
    point: number[];
    status: boolean;
    p: ResponseContextProps;
}

export type EventProps = {
    request: RequestProps;
    point: number[];
}

export interface ButtonZoom {
    topLeft?: boolean;
    topRight?: boolean;
    bottomLeft?: boolean;
    bottomRight?: boolean;
}

export interface Position {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface RelationProps {
    external_resource_id?: number;
    relation_key?: string;
    relation_value?: number;
}

export interface AttributeProps {
    attr: string;
    datatype: string;
    format_field: FormatNumberFieldData
    key: number;
    value: string;
}

export interface DataProps<F extends Attrs = Attrs> {
    id?: number;
    label?: string;
    layerId?: number;
    desc?: string;
    dop?: number;
    styleId: number;
    value?: string;
    point?: string;
    permission?: string;
    relation?: RelationProps;
    type?: string;
    fields?: F;
    attr: AttributeProps[];
}

export interface Response {
    featureCount: number;
    data: DataProps[];
}

export interface Props {
    op: string;
    response: Response;
    position: Position;
    selected?: DataProps;
    mode?: string;
    point?: boolean;
}

export interface ContextProps {
    key: number;
    title: string;
    result: string;
    visible: boolean;
}
export interface Visible {
    hidden: boolean;
    overlay: boolean | undefined;
    key: string;
}
export interface Params {
    params: Props;
    visible: ({ hidden, overlay, key }: Visible) => void;
    store: PopupStore;
    array_context?: ContextProps[] | [];
    countFeature: number;
    event: MapBrowserEvent;
}

interface ControlProps {
    icon: ReactElement;
    url?: string;
    title: string;
    status?: boolean | string;
    checked?: boolean;
    disable?: boolean;
}

export interface ControlUrlProps {
    [key: string]: ControlProps;
}