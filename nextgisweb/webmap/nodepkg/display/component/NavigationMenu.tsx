import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Typography } from "@nextgisweb/gui/antd";

import type { PanelManager } from "../../panel/PanelManager";
import type { Display } from "../Display";

import Information from "@nextgisweb/icon/mdi/information";
import Cogs from "@nextgisweb/icon/mdi/cogs";

import "./NavigationMenu.less";

const { Link } = Typography;

export const NavigationMenu = observer(({ store, display }: { store: PanelManager, display: Display }) => {
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
    return (
        <div className="ngw-webmap-display-navigation-menu">
            {store.sorted().map(({ name, title, plugin }) => (
                <div
                    key={name}
                    title={title}
                    onClick={() => onClickItem(name)}
                    className={classNames(
                        "ngw-webmap-display-navigation-menu-item",
                        { "active": name === active?.name }
                    )}
                >
                    {plugin.icon}
                </div>
            ))}
            {!display.tinyConfig && infomap.scope ? (
                <div className="infoblock">
                    <Link target="_blank" href={infomap.link}><span title={gettext("Map properties")} className="iconLinks"><Information /></span></Link>
                    <Link target="_blank" href={infomap.update}><span title={gettext("Map settings")} className="iconLinks"><Cogs /></span></Link>
                </div>
            ) : null}
        </div>
    );
});

NavigationMenu.displayName = "NavigationMenu";
