import { action, observable } from "mobx";

import type { DataProps, Rnd } from "./type";

export class IdentifyStore {
    @observable accessor layerName: string | null = null;
    @observable accessor fixPopup = false;
    @observable accessor hideLegend = true;
    @observable accessor update = false;
    @observable accessor fullscreen = false;

    @observable.ref accessor data: DataProps[] = [];
    @observable.ref accessor selected: DataProps | null = null;
    @observable.ref accessor attribute: object | null = null;
    @observable.ref accessor extensions: object | null = null;
    @observable.ref accessor currentUrlParams: string | null = null;
    @observable.ref accessor contextUrl: string | null = null;
    @observable.ref accessor fixContentItem: string | null = null;
    @observable.ref accessor linkToGeometry: string | null = null;
    @observable.ref accessor valueRnd: Rnd | null = null;
    @observable.ref accessor fixPos: Rnd | null = null;
    @observable.ref accessor fixPanel: string | null = null;
    @observable.ref accessor result: object | undefined = undefined;

    constructor({
        valueRnd,
        fixPos,
        fixPanel
    }) {
        this.valueRnd = valueRnd;
        this.fixPos = fixPos;
        this.fixPanel = fixPanel;
    }

    @action
    setValueRnd(valueRnd: Rnd) {
        this.valueRnd = valueRnd;
    };

    @action
    setResult(result: object) {
        this.result = result;
    };

    @action
    setHideLegend(hideLegend: boolean) {
        this.hideLegend = hideLegend;
    };

    @action
    setFixPos(fixPos: Rnd) {
        this.fixPos = fixPos;
    };

    @action
    setFixPanel(fixPanel: string) {
        this.fixPanel = fixPanel;
    };

    @action
    setFixPopup(fixPopup: boolean) {
        this.fixPopup = fixPopup;
    };

    @action
    setLayerName(layerName: string) {
        this.layerName = layerName;
    };

    @action
    setData(data: DataProps[]) {
        this.data = data;
    };

    @action
    setSelected(selected: DataProps) {
        this.selected = selected;
    };

    @action
    setAttribute(attribute: object) {
        this.attribute = attribute;
    };

    @action
    setExtensions(extensions: object) {
        this.extensions = extensions;
    };

    @action
    setUpdate(update: boolean) {
        this.update = update;
    };

    @action
    setCurrentUrlParams(currentUrlParams: string) {
        this.currentUrlParams = currentUrlParams;
    };

    @action
    setFullscreen(fullscreen: boolean) {
        this.fullscreen = fullscreen;
    };

    @action
    setContextUrl(contextUrl: string) {
        this.contextUrl = contextUrl;
    };

    @action
    setFixContentItem(fixContentItem: string) {
        this.fixContentItem = fixContentItem;
    };

    @action
    setLinkToGeometry(linkToGeometry: string) {
        this.linkToGeometry = linkToGeometry;
    };
}