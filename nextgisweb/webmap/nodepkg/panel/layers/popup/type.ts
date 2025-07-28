import type { Attrs } from "@nextgisweb/feature-layer/type";
import type { FormatNumberFieldData } from "@nextgisweb/feature-layer/fields-widget/FieldsStore";

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

export type RequestProps = {
    srs: number;
    geom: string;
    styles: string[];
    point: number[];
    status: boolean;
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
    pointClick: PointClickProps;
    buttonZoom: ButtonZoom;
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

export interface Params {
    params: Props;
    visible: ({ hidden, overlay, key }: Visible) => void;
    display: Display;
    array_context?: ContextProps[] | [];
    countFeature: number;
    event: MapBrowserEvent;
}