import { action, computed, observable } from "mobx";
import type { ReactNode } from "react";

import { ModalStore } from "@nextgisweb/gui/show-modal/ModalStore";
import { routeURL } from "@nextgisweb/pyramid/api";
import settings from "@nextgisweb/pyramid/client-settings";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { url } from "../nextgis";

import type { ModalAPI } from "./type";

const NOTIFICATION_ORDER = ["success", "danger"];

export interface MenuItem {
    className?: string;
    href?: string;
    target?: string;
    title?: ReactNode;
    notification?: string;
}

export interface ModalItem {
    id: string;
    element: ReactNode;
}

class LayoutStore {
    readonly modalStore: ModalStore = new ModalStore();

    @observable.shallow accessor menuItems: MenuItem[] = [];
    @observable.ref accessor hideMenu = false;

    @observable.shallow accessor modal: ModalAPI | null = null;

    @action.bound
    setModalApi(modal: ModalAPI | null) {
        this.modal = modal;
    }

    @action.bound
    addMenuItem(item: MenuItem) {
        this.menuItems.push(item);
    }

    @action.bound
    setHideMenu(val: boolean) {
        this.hideMenu = val;
    }

    @computed
    get notification() {
        let current: string | null = null;
        this.menuItems.forEach(({ notification }) => {
            if (!notification) return;
            if (
                !current ||
                NOTIFICATION_ORDER.indexOf(notification) >
                NOTIFICATION_ORDER.indexOf(current)
            ) {
                current = notification;
            }
        });
        return current;
    }
}

export const layoutStore = new LayoutStore();

layoutStore.addMenuItem({
    href: routeURL("resource.show", 0),
    title: gettext("Resources"),
    target: "_blank",
});

if (ngwConfig.controlPanel) {
    layoutStore.addMenuItem({
        href: routeURL("pyramid.control_panel"),
        title: gettext("Control panel"),
        target: "_blank",
    });
}

if (settings["help_page_url"]) {
    layoutStore.addMenuItem({
        href: url(settings["help_page_url"]),
        title: gettext("Help"),
        target: "_blank",
    });
}
