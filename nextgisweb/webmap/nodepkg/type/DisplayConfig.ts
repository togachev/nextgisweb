import type { GroupItem } from "./TreeItems";

interface Scope {
    read: boolean;
    write: boolean;
    manage: boolean;
}

interface Annotations {
    enabled: boolean;
    default: string;
    scope: Scope;
}

interface WebmapPlugin {
    [name: string]: Record<string, unknown>;
}

interface InfoMap {
    resource: string;
    link: string;
    update: string;
    scope: Scope;
}

interface Mid {
    adapter: string[];
    basemap: string[];
    plugin: string[];
}

interface ItemsStates {
    expanded: any[];
    checked: number[];
}

export interface DisplayConfig {
    extent: number[];
    extent_const: null[];
    rootItem: GroupItem;
    itemsStates: ItemsStates;
    infomap: InfoMap;
    mid: Mid;
    webmapPlugin: WebmapPlugin;
    bookmarkLayerId?: any;
    webmapId: number;
    webmapDescription: string;
    webmapTitle: string;
    webmapEditable: boolean;
    webmapLegendVisible: string;
    drawOrderEnabled?: any;
    annotations: Annotations;
    units: string;
}
