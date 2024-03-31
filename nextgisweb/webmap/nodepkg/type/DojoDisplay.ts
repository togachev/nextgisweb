/// <reference types="dojo/dijit" />

import type Feature from "ol/Feature";
import type { Control as OlControl } from "ol/control";

import type WebmapStore from "../store";

import type { DisplayConfig } from "./DisplayConfig";
import type { DisplayMap } from "./DisplayMap";
import type { MapStatesObserver } from "./MapState";
import type { WebmapItem } from "./WebmapItem";
import type { WebmapLayer } from "./WebmapLayer";
import type { WebmapPlugin } from "./WebmapPlugin";

import type { DojoItem } from ".";

export interface HighlightFeatureData {
    geom: string;
    featureId: number;
    layerId: number;
}

export type StoreItem = dojo.data.api.Item;

export interface CustomItemFileWriteStore extends dojo.data.ItemFileWriteStore {
    dumpItem: (item: StoreItem) => WebmapItem;
}

export interface FeatureHighlighter {
    highlightFeature: (data: HighlightFeatureData) => void;
    getHighlighted: () => Feature[];
    unhighlightFeature: (filter: (feature: Feature) => boolean) => void;
}

export interface MapTool extends dijit._WidgetBase {
    activate: () => void;
    deactivate: () => void;
}

export interface MapToolbarItems {
    addTool: (tool: MapTool, state: string, place?: HTMLElement) => void;
    addSeparator: () => void;
    addButton: (button: DojoItem, options: any) => void;
}

export interface MapToolbar extends OlControl {
    items: MapToolbarItems;
}

interface DojoDisplayIdentifyPopup {
    widget?: DojoDisplayIdentify;
}

export interface DojoDisplayIdentify {
    _popup: DojoDisplayIdentifyPopup;
    reset: () => void;
}

export type MapControl = OlControl | dijit._WidgetBase | DojoDisplayIdentify;

export interface DojoDisplay extends dijit._WidgetBase {
    config: DisplayConfig;
    identify: DojoDisplayIdentify;
    featureHighlighter: FeatureHighlighter;
    getUrlParams: () => Record<string, string>;
    isTinyMode: () => boolean;

    itemStore: CustomItemFileWriteStore;
    webmapStore: WebmapStore;
    mapStates: MapStatesObserver;

    map: DisplayMap;
    mapContainer: dijit.layout.BorderContainer;
    displayProjection: string;

    mapToolbar: MapToolbar;
    _mapAddControls: (controls: MapControl[]) => void;
    _plugins: WebmapPlugin[];

    leftTopControlPane: HTMLDivElement;
    leftBottomControlPane: HTMLDivElement;
    rightTopControlPane: HTMLDivElement;
    rightBottomControlPane: HTMLDivElement;

    /**
     * @deprecated use webmapStore.getlayers() instead
     */
    _layers: Record<number, WebmapLayer>;
}
