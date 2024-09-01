import type { RequestProps } from "@nextgisweb/webmap/panel/diagram/type";
import type { DojoDisplay } from "@nextgisweb/webmap/type";

export interface DataProps {
    id: number;
    label: string;    
    layerId: number;
    desc: string;   
    dop: number;
    styleId: number;
    value: string;
    permission: string;
}

export interface UrlParamsProps {
    lon: number;
    lat: number;
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

export interface Response {
    featureCount: number;
    data: DataProps[];
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
    display: DojoDisplay;
    array_context: ContextProps[];
}