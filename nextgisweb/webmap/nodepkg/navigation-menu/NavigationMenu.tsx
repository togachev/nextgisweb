import { observer } from "mobx-react-lite";
import type { ReactElement } from "react";

import type { PanelDojoItem, DojoDisplay } from "../type";

import { navigationMenuStore } from "./NavigationMenuStore";
import { Typography } from "@nextgisweb/gui/antd";
import { SettingOutlined } from '@ant-design/icons';
import Information from "@nextgisweb/icon/mdi/information";
import { gettext } from "@nextgisweb/pyramid/i18n";

import "./NavigationMenu.less";

export interface NavigationMenuProps {
    panels: Map<string, PanelDojoItem>;
    display: DojoDisplay;
}

const { Link } = Typography;

export const NavigationMenu = observer(({ panels, display }: NavigationMenuProps) => {
    const onClickItem = (item: PanelDojoItem) => {
        navigationMenuStore.setActive(item.name, "menu");
    };

    const infomap = display.config.infomap

    const menuItems: ReactElement[] = [];
    if (panels) {
        const activePanel = navigationMenuStore.activePanel;
        panels.forEach((p) => {
            const activeClass = p.name === activePanel ? "active" : "";
            menuItems.push(
                <div
                    key={p.name}
                    className={`navigation-menu__item ${activeClass}`}
                    title={p.title}
                    onClick={() => onClickItem(p)}
                >
                    <svg className="icon" fill="currentColor">
                        <use xlinkHref={`#icon-${p.menuIcon}`} />
                    </svg>
                </div>
            );
        });
    }

    return (
        <div className="navigation-menu">
            {menuItems}
            {infomap.scope ? (
                <div className="infoblock">
                    <Link target="_blank" href={infomap.link}><span title={gettext("Map properties")} className="iconLinks"><Information /></span></Link>
                    <Link target="_blank" href={infomap.update}><span title={gettext("Map settings")} className="iconLinks"><SettingOutlined /></span></Link>
                </div>
            ) : null}
        </div>
    );
});
