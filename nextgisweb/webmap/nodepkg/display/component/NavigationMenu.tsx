import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";
import { ModalMapgroup } from "@nextgisweb/resource/home-page/component";
import showModal from "@nextgisweb/gui/showModal";
import type { PanelManager } from "../../panel/PanelManager";
import type { Display } from "@nextgisweb/webmap/display";

import Cogs from "@nextgisweb/icon/mdi/cogs";

import "./NavigationMenu.less";

export interface NavigationMenuProps {
    store: PanelManager;
    layout?: "vertical" | "horizontal";
    display: Display;
}

export const NavigationMenu = observer<NavigationMenuProps>(
    ({ store, layout = "vertical", display }) => {
        const onClickItem = useCallback(
            (name: string) => {
                if (store.activePanelName === name) {
                    store.closePanel();
                } else {
                    store.setActive(name, "menu");
                }
            },
            [store]
        );

        const active = store.activePanel;

        return (
            <div className={classNames("ngw-webmap-display-navigation-menu", layout)}>
                {store.visiblePanels.map(({ name, title, plugin }) => (
                    <div
                        key={name}
                        title={title}
                        onClick={() => onClickItem(name)}
                        className={classNames("item", {
                            "active": name === active?.name,
                        })}
                    >
                        {plugin.icon}
                    </div>
                ))}
                <div className="empty-block"></div>
                {display.config.scope &&
                    <div
                        title={gettext("Map settings")}
                        className="item"
                        onClick={() => showModal(ModalMapgroup, {
                            transitionName: "",
                            maskTransitionName: "",
                            width: isM ? "100%" : "75%",
                            closeIcon: isM ? true : false,
                            options: {
                                setup: { operation: "update", id: display.config.webmapId },
                                location: "reload",
                                height: isM ? "90vh" : "70vh",
                                padding: isM && "32px 6px 6px 6px",
                            },
                        })}
                    >
                        <Cogs />
                    </div>
                }
            </div>
        );
    }
);

NavigationMenu.displayName = "NavigationMenu";
