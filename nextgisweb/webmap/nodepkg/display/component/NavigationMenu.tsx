import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { PanelManager } from "../../panel/PanelManager";
import type { Display } from "../Display";

import Information from "@nextgisweb/icon/mdi/information";
import Cogs from "@nextgisweb/icon/mdi/cogs";
import Home from "@nextgisweb/icon/mdi/home-circle";

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

        const infomap = display.config.infomap;
        const active = store.activePanel;

        const CustomMenu = () => {
            if (display.tinyConfig && !infomap.scope) return;
            return (
                <div className={classNames("info-block", layout)}>
                    <a title={gettext("Resources")} target="_blank" href={infomap.resource} className="iconLinks"><Home /></a>
                    <a title={gettext("Map properties")} target="_blank" href={infomap.link} className="iconLinks"><Information /></a>
                    <a title={gettext("Map settings")} target="_blank" href={infomap.update} className="iconLinks"><Cogs /></a>
                </div>
            )
        }

        return (
            <div className={classNames(
                "custom-menu",
                layout
            )}>
                <div
                    className={classNames(
                        "ngw-webmap-display-navigation-menu",
                        layout
                    )}
                >
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
                </div>
                <CustomMenu />
            </div>
        );
    }
);

NavigationMenu.displayName = "NavigationMenu";
