import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { isMobile as isM } from "@nextgisweb/webmap/mobile/selectors";
import { ModalMapgroup } from "@nextgisweb/resource/home-page/component";
import showModal from "@nextgisweb/gui/showModal";
import { Button } from "@nextgisweb/gui/antd";
import type { PanelManager } from "../../panel/PanelManager";
import type { Display } from "@nextgisweb/webmap/display";

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

        const customMenu = [
            {
                title: gettext("Resources"),
                key: gettext("Resources"),
                target: "_blank",
                href: infomap.resource,
                className: "item",
                icon: <Home />,
                type: "link",
            },
            {
                title: gettext("Map properties"),
                key: gettext("Map properties"),
                target: "_blank",
                href: infomap.link,
                className: "item",
                icon: <Information />,
                type: "link",
            },
            infomap.scope && {
                title: gettext("Map settings"),
                key: gettext("Map settings"),
                target: "_blank",
                onClick: () => showModal(ModalMapgroup, {
                    transitionName: "",
                    maskTransitionName: "",
                    options: {
                        setup: { operation: "update", id: infomap.update.id },
                        location: "reload",
                    },
                }),
                className: "component",
                icon: <Cogs />,
                type: "component",
            }
        ]

        const CustomMenu = () => {
            if (display.tinyConfig && !infomap.scope) return;
            return (
                <div className={classNames("info-block", layout)}>
                    {customMenu.map(({ title, key, target, href, onClick, className, icon, type }) => {
                        if (type === "link") {
                            return (
                                <a key={key} title={title} target={target} href={href} className={className}>{icon}</a>
                            )
                        } else if (type === "component") {
                            return <Button title={title} key={key} type="text" className={className} onClick={onClick} icon={icon} />
                        }
                    })}
                </div>
            )
        }

        return (
            <div className={classNames("navigation-menu", layout)}>
                <div style={
                    !isM ?
                        layout === "vertical" ?
                            {
                                width: 40,
                                height: infomap.scope ? "calc(100% - 116px)" : "calc(100% - 84px)",
                            } :
                            {
                                width: infomap.scope ? "calc(100% - 116px)" : "calc(100% - 84px)",
                                height: 40,
                            } :
                        layout === "vertical" ?
                            {
                                width: 40,
                                height: "100%",
                            } :
                            {
                                width: "100%",
                                height: 40,
                            }
                } className={classNames("ngw-webmap-display-navigation-menu", layout)}>
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
                {!isM && <CustomMenu />}
            </div>
        );
    }
);

NavigationMenu.displayName = "NavigationMenu";
