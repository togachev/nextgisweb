import type { DojoDisplay } from "@nextgisweb/webmap/type";
import type { DojoTopic } from "@nextgisweb/webmap/panels-manager/type";

export type DiagramProps = {
    display: DojoDisplay;
    topic: DojoTopic;
    close: () => void;
}

export type GraphProps = {
    display: DojoDisplay;
    topic: DojoTopic;
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
    label: string;
    pointBorderColor: string;
    backgroundColor: string;
    borderColor: string;
    data: AxisProps[];
    labels: string[];
}