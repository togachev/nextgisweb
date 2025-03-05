import { observer } from "mobx-react-lite";
import { authStore } from "@nextgisweb/auth/store";
import { Button, Input, Menu, Typography } from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { gettext } from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import MenuIcon from "@nextgisweb/icon/mdi/menu";
import Login from "@nextgisweb/icon/mdi/login";
import Logout from "@nextgisweb/icon/mdi/logout";
import AccountCogOutline from "@nextgisweb/icon/mdi/account-cog-outline";
import FolderOutline from "@nextgisweb/icon/mdi/folder-outline";
import Cog from "@nextgisweb/icon/mdi/cog";

import "./Header.less";

type MenuItem = Required<MenuProps>["items"][number];

const { Title } = Typography;
const signInText = gettext("Sign in");

export const Header = observer(({ store, config }) => {
    const { authenticated, invitationSession, userDisplayName } = authStore;

    const {
        editHeader,
        setEditHeader,
        valueHeader,
        setValueHeader,
    } = store;

    const save = async () => {
        const payload = Object.fromEntries(
            Object.entries(valueHeader || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { pyramid: { home_page_header: payload } },
        });
    };

    const showLoginModal = () => {
        if (oauth.enabled && oauth.default) {
            const qs = new URLSearchParams([["next", window.location.href]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const header_image = routeURL("pyramid.asset.header_image")
    const url = routeURL("resource.show", 0);

    const items: MenuItem[] = valueHeader?.menus.menu && getEntries(valueHeader?.menus?.menu).map(item => ({
        key: item[0],
        label: (<a href={item[1]?.value} target="_blank" rel="noopener noreferrer">{item[1]?.name}</a>),
        name: item[1]?.name,
        value: item[1]?.value,
    }));

    items.push({
        key: "auth",
        label: authenticated ?
            (<span className="auth-login">{userDisplayName}</span>) :
            authStore.showLoginModal ?
                (<a onClick={showLoginModal} href={ngwConfig.logoutUrl}>{signInText} <Login /></a>) :
                (<a href={ngwConfig.logoutUrl}>{signInText}</a>),
        children:
            authenticated && [
                {
                    key: "resources",
                    label: (<a href={url} target="_blank" rel="noopener noreferrer">{gettext("Resources")}</a>),
                    icon: <span className="menu-icon"><FolderOutline /></span>,
                },
                config.isAdministrator === true && {
                    key: "control-panel",
                    icon: <span className="menu-icon"><Cog /></span>,
                    label: (<a href="/control-panel" target="_blank" rel="noopener noreferrer">{gettext("Control panel")}</a>),
                },
                invitationSession && {
                    label: (<div className="warning">{gettext("Invitation session")}</div>),
                    key: gettext("Invitation session"),
                },
                {
                    label: (<a target="_blank" rel="noopener noreferrer" href={routeURL("auth.settings")}>{gettext("Settings")}</a>),
                    icon: <span className="menu-icon"><AccountCogOutline /></span>,
                    key: gettext("Settings"),
                },
                {
                    label: (<a onClick={() => authStore.logout()} className="auth-login">{gettext("Sign out")}</a>),
                    icon: <span className="menu-icon"><Logout /></span>,
                    key: gettext("Sign out"),
                },
            ]
    })

    const MenuContainer = () => {
        return (
            <Menu
                selectable={false}
                mode="horizontal"
                items={items}
                theme="light"
                overflowedIndicator={<span className="menu-indicator"><MenuIcon /></span>}
            />)
    }

    return (
        <div className="header" style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(" + header_image + ")" }}>
            <div className="control-button">
                {config.isAdministrator === true && (<Button
                    className={editHeader ? "icon-pensil" : "icon-edit"}
                    shape="square"
                    title={editHeader ? gettext("Edit menu") : gettext("Save menu")}
                    type="default"
                    icon={editHeader ? <Edit /> : <Save />}
                    onClick={() => {
                        setEditHeader(!editHeader);
                        save()
                    }}
                />)}
                {!editHeader && (
                    <Button
                        className="icon-edit"
                        shape="square"
                        title={gettext("Add urls")}
                        type="default"
                        onClick={() => {
                            setValueHeader((prev) => ({
                                ...prev,
                                menus: {
                                    ...prev.menus,
                                    menu: {
                                        ...prev.menus.menu,
                                        [String(Object.keys(prev.menus.menu).length + 1)]: {
                                            ...prev.menus.menu[
                                            String(Object.keys(prev.menus.menu).length + 1)
                                            ],
                                            name: "",
                                            value: "",
                                        },
                                    },
                                },
                            }));
                        }}
                        icon={<LinkEdit />}
                    />
                )}
            </div>
            <div className="menus">
                <div className="menu-component">
                    <div className={editHeader ? "button-link" : "button-link edit-panel"}>
                        {!editHeader ? items.map((item) => {
                            if (!["auth", "resources"].includes(item.key)) {
                                return (
                                    <div key={item.key} className="menu-link">
                                        <div className="item-edit">
                                            <Input
                                                placeholder={gettext("Name url")}
                                                type="text"
                                                value={item?.name}
                                                allowClear
                                                disabled={editHeader}
                                                onChange={(e) => {
                                                    setValueHeader((prev) => ({
                                                        ...prev,
                                                        menus: {
                                                            ...prev.menus,
                                                            menu: {
                                                                ...prev.menus.menu,
                                                                [item.key]: {
                                                                    ...prev.menus.menu[item.key],
                                                                    name: e.target.value,
                                                                },
                                                            },
                                                        },
                                                    }));
                                                }}
                                            />
                                            <Input
                                                placeholder={gettext("Url")}
                                                type="text"
                                                value={item?.value}
                                                allowClear
                                                disabled={editHeader}
                                                onChange={(e) => {
                                                    setValueHeader((prev) => ({
                                                        ...prev,
                                                        menus: {
                                                            ...prev.menus,
                                                            menu: {
                                                                ...prev.menus.menu,
                                                                [item.key]: {
                                                                    ...prev.menus.menu[item.key],
                                                                    value: e.target.value,
                                                                },
                                                            },
                                                        },
                                                    }));
                                                }}
                                            />
                                            <Button
                                                title={gettext("Delete urls")}
                                                onClick={() => {
                                                    const state = { ...valueHeader };
                                                    delete state.menus.menu[item.key];
                                                    setValueHeader(state);
                                                }}
                                                className="icon-edit"
                                                icon={<DeleteOffOutline />}
                                            />
                                        </div>
                                    </div>
                                )
                            }
                        }) :
                            (<MenuContainer />)}
                        {!editHeader &&
                            <div className="edit-title">
                                <div className="title-item">
                                    <Input
                                        placeholder={gettext("Title")}
                                        type="text"
                                        value={valueHeader?.names?.first_name}
                                        allowClear
                                        disabled={editHeader}
                                        onChange={(e) => {
                                            setValueHeader((prev) => ({
                                                ...prev,
                                                names: {
                                                    ...prev.names,
                                                    first_name: e.target.value,
                                                },
                                            }));
                                        }}
                                    />
                                </div>
                                <div className="title-item">
                                    <Input
                                        placeholder={gettext("Title description")}
                                        type="text"
                                        value={valueHeader?.names?.last_name}
                                        allowClear
                                        disabled={editHeader}
                                        onChange={(e) => {
                                            setValueHeader((prev) => ({
                                                ...prev,
                                                names: {
                                                    ...prev.names,
                                                    last_name: e.target.value,
                                                },
                                            }));
                                        }}
                                    />
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
            <div className="name-site">
                <div className="title">
                    <Title className="name-site-a" level={1} >{valueHeader?.names?.first_name}</Title>
                    <Title className="name-site-b" level={5} >{valueHeader?.names?.last_name}</Title>
                </div>
            </div>
        </div >
    );
});