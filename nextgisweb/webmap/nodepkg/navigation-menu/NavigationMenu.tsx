import { observer } from "mobx-react-lite";
import type { ReactElement } from "react";

import type { PanelDojoItem } from "../panels-manager/type";

import { navigationMenuStore } from "./NavigationMenuStore";
import { Typography } from "@nextgisweb/gui/antd";
import { InfoCircleOutlined, SettingOutlined } from '@ant-design/icons';

import "./NavigationMenu.less";

export interface NavigationMenuProps {
    panels: Map<string, PanelDojoItem>;
}

const { Link } = Typography;

const Links = ({ infomap }) => {
    return (
        <div className="infoblock">
            <Link href={infomap.link}><span className="iconLinks"><InfoCircleOutlined /></span></Link>
            <Link href={infomap.update}><span className="iconLinks"><SettingOutlined /></span></Link>
        </div>
    )
}

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

    return <div className="navigation-menu">{menuItems}{infomap.scope ? <Links infomap={infomap} /> : null}</div>;
});
