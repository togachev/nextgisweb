import classNames from "classnames";
import { observer } from "mobx-react-lite";
import { useCallback } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Dropdown, Row, Col, Typography } from "@nextgisweb/gui/antd";

import type { MenuProps } from "@nextgisweb/gui/antd";
import type { PanelManager } from "../../panel/PanelManager";
import type { Display } from "../Display";

import Information from "@nextgisweb/icon/mdi/information";
import Cogs from "@nextgisweb/icon/mdi/cogs";
import Home from "@nextgisweb/icon/mdi/home-circle";
import LinkIcon from "@nextgisweb/icon/mdi/link";

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

    const items: MenuProps['items'] = [
        {
            key: '1',
            label: (
                <Link target="_blank" href={infomap.link}><span title={gettext("Map properties")} className="iconLinks">{gettext("Map properties")}</span></Link>
            ),
            icon: <Information />,
        },
        {
            key: '2',
            label: (
                <Link target="_blank" href={infomap.update}><span title={gettext("Map settings")} className="iconLinks">{gettext("Map settings")}</span></Link>
            ),
            icon: <Cogs />,
        },
        {
            key: '3',
            label: (
                <Link target="_blank" href={infomap.resource}><span title={gettext("Resources")} className="iconLinks">{gettext("Resources")}</span></Link>
            ),
            icon: <Home />,
        },
    ];

    const active = store.activePanel;
    return (
        <Row className="ngw-webmap-display-navigation-menu">
            <Col>
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
            </Col>
            <Col>
                {!display.tinyConfig && infomap.scope ? (
                    <Dropdown menu={{ items }} trigger={["click", "hover"]}>
                        <div className="infoblock" onClick={(e) => e.preventDefault()}>
                            <span title={gettext("Map properties")} className="iconLinks">
                                <LinkIcon />
                            </span>
                        </div>
                    </Dropdown>
                ) : null}
            </Col>
        </Row>
    );
});

NavigationMenu.displayName = "NavigationMenu";
