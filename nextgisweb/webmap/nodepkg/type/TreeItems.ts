interface BaseItem {
    id: number;
    key: number;
    type: "layer" | "group" | "root";
    label: string;
    title: string;
}
export interface RootItem extends BaseItem {
    type: "root";
    children: TreeItem[];
}

export interface GroupItem extends BaseItem {
    type: "group";
    expanded: boolean;
    exclusive: boolean;
    children: TreeItem[];
}

interface Icon {
    format: string;
    data: string;
}
export interface SymbolInfo {
    index: number;
    render: boolean;
    display_name: string;
    icon: Icon;
}

interface LegendInfo {
    visible: string;
    has_legend: boolean;
    symbols: SymbolInfo[];
    single: boolean;

    open?: boolean;
}

export interface LayerItem extends BaseItem {
    type: "layer";
    layerId: number;
    styleId: number;
    visibility: boolean;
    identifiable: boolean;
    transparency: number | null;
    minScaleDenom: number | null;
    maxScaleDenom: number | null;
    drawOrderPosition: number | null;
    legendInfo: LegendInfo;
    adapter: string;
    plugin: Record<string, unknown>;
    minResolution: number | null;
    maxResolution: number | null;
    editable?: boolean;
    layerCls: string | "";
}

export type TreeItem = GroupItem | LayerItem | RootItem;
