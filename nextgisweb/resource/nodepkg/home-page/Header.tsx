import { useState } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "@nextgisweb/auth/store";
import { Button, Input, Menu, Typography } from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
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
import Account from "@nextgisweb/icon/mdi/account";
import AccountCogOutline from "@nextgisweb/icon/mdi/account-cog-outline";
import FolderOutline from "@nextgisweb/icon/mdi/folder-outline";
import Cog from "@nextgisweb/icon/mdi/cog";
import { HomeStore } from "./HomeStore";
import "./Header.less";

type MenuItem = Required<MenuProps>["items"][number];

const { Title } = Typography;
const signInText = gettext("Sign in");

export const Header = observer(({ store: storeProp, config }) => {
    const { authenticated, invitationSession, userDisplayName } = authStore;
    const [disable, setDisable] = useState(true);

    const [store] = useState(
        () => storeProp || new HomeStore()
    );

    const {
        valueHeader,
        valueFooter,
    } = store;

    const showLoginModal = () => {
        if (oauth.enabled && oauth.default) {
            const qs = new URLSearchParams([["next", window.location.href]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const colorText = { color: valueFooter?.logo?.colorText }
    const styleMenu = { color: valueFooter?.logo?.colorText }

    const header_image = routeURL("pyramid.asset.header_image")
    const url = routeURL("resource.show", 0);

    const items: MenuItem[] = [];

    valueHeader?.menus?.menu && getEntries(valueHeader?.menus?.menu).map(item => items.push({
        key: item[0],
        label: (<a href={item[1]?.value} target="_blank" rel="noopener noreferrer" style={colorText}>{item[1]?.name}</a>),
        name: item[1]?.name,
        value: item[1]?.value,
        className: "menu-label"
    }));

    items.push({
        key: "auth",
        label: authenticated ?
            (<span className="auth-login"><Account /></span>) :
            authStore.showLoginModal ?
                (<a onClick={showLoginModal} href={ngwConfig.logoutUrl}>{signInText} <Login /></a>) :
                (<a href={ngwConfig.logoutUrl}>{signInText}</a>),
        children:
            authenticated && [
                {
                    key: "user-name",
                    label: <span style={styleMenu} className="account-name">{userDisplayName}</span>,
                    type: "group",
                },
                {
                    key: "resources",
                    label: (<a href={url} target="_blank" rel="noopener noreferrer">{gettext("Resources")}</a>),
                    extra: <span style={styleMenu}><FolderOutline /></span>,
                },
                config.isAdministrator === true && {
                    key: "control-panel",
                    extra: <span style={styleMenu}><Cog /></span>,
                    label: (<a href="/control-panel" target="_blank" rel="noopener noreferrer">{gettext("Control panel")}</a>),
                },
                invitationSession && {
                    label: (<div className="warning">{gettext("Invitation session")}</div>),
                    key: gettext("Invitation session"),
                },
                {
                    label: (<a target="_blank" rel="noopener noreferrer" href={routeURL("auth.settings")}>{gettext("Settings")}</a>),
                    extra: <span style={styleMenu}><AccountCogOutline /></span>,
                    key: gettext("Settings"),
                },
                {
                    label: (<a onClick={() => authStore.logout()} className="auth-login">{gettext("Sign out")}</a>),
                    extra: <span style={styleMenu}><Logout /></span>,
                    key: gettext("Sign out"),
                },
            ],
    })

    const MenuContainer = () => {
        return (
            <Menu
                selectable={false}
                mode="horizontal"
                items={items}
                theme="dark"
                overflowedIndicator={<span className="menu-indicator"><MenuIcon /></span>}
                triggerSubMenuAction="hover"
            />)
    }

    return (
        <div className="header" style={{ backgroundImage: "linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(" + header_image + ")" }}>
            <div className="control-button">
                {config.isAdministrator === true && (<Button
                    className={disable ? "icon-pensil" : "icon-edit-control"}
                    shape="square"
                    title={disable ? gettext("Edit") : gettext("Save")}
                    type="default"
                    icon={disable ? <Edit /> : <Save />}
                    onClick={() => {
                        setDisable(!disable);
                        store.setEditHeader(!store.editHeader);
                        store.saveSetting(valueHeader, "home_page_header")
                    }}
                />)}
                {!disable && (
                    <Button
                        className="icon-edit-control"
                        shape="square"
                        title={gettext("Add url")}
                        type="default"
                        onClick={() => {
                            const value = {
                                ...valueHeader,
                                menus: {
                                    ...valueHeader.menus,
                                    menu: {
                                        ...valueHeader.menus.menu,
                                        [String(Object.keys(valueHeader.menus.menu).length + 1)]: {
                                            ...valueHeader.menus.menu[
                                            String(Object.keys(valueHeader.menus.menu).length + 1)
                                            ],
                                            name: "",
                                            value: "",
                                        },
                                    },
                                },
                            }
                            store.setValueHeader(value);
                        }}
                        icon={<LinkEdit />}
                    />
                )}
            </div>
            <div className="menus">
                <div className={disable ? "menu-component" : ""}>
                    <div className={disable ? "button-link" : "button-link edit-panel"}>
                        {!disable ? items.map((item) => {
                            if (!["auth", "resources"].includes(item.key)) {
                                return (
                                    <div key={item.key} className="item-edit">
                                        <Input
                                            placeholder={gettext("Name url")}
                                            type="text"
                                            value={item?.name}
                                            allowClear
                                            disabled={disable}
                                            onChange={(e) => {
                                                const value = {
                                                    ...valueHeader,
                                                    menus: {
                                                        ...valueHeader.menus,
                                                        menu: {
                                                            ...valueHeader.menus.menu,
                                                            [item.key]: {
                                                                ...valueHeader.menus.menu[item.key],
                                                                name: e.target.value,
                                                            },
                                                        },
                                                    },
                                                }
                                                store.setValueHeader(value);
                                            }}
                                        />
                                        <Input
                                            className="first-input"
                                            placeholder={gettext("Url")}
                                            type="text"
                                            value={item?.value}
                                            allowClear
                                            disabled={disable}
                                            onChange={(e) => {
                                                const value = {
                                                    ...valueHeader,
                                                    menus: {
                                                        ...valueHeader.menus,
                                                        menu: {
                                                            ...valueHeader.menus.menu,
                                                            [item.key]: {
                                                                ...valueHeader.menus.menu[item.key],
                                                                value: e.target.value,
                                                            },
                                                        },
                                                    },
                                                }
                                                store.setValueHeader(value);
                                            }}
                                        />
                                        <Button
                                            title={gettext("Delete url")}
                                            onClick={() => {
                                                const state = { ...valueHeader };
                                                delete state.menus.menu[item.key];
                                                store.setValueHeader(state);
                                            }}
                                            className="icon-edit"
                                            icon={<DeleteOffOutline />}
                                        />
                                    </div>
                                )
                            }
                        }) :
                            (<MenuContainer />)}
                        {!disable &&
                            <div className="edit-title">
                                <div className="item-edit">
                                    <Input
                                        placeholder={gettext("First name site")}
                                        type="text"
                                        value={valueHeader?.names?.first_name}
                                        allowClear
                                        disabled={disable}
                                        onChange={(e) => {
                                            const value = {
                                                ...valueHeader,
                                                names: {
                                                    ...valueHeader.names,
                                                    first_name: e.target.value,
                                                },
                                            }
                                            store.setValueHeader(value);
                                        }}
                                    />
                                </div>
                                <div className="item-edit">
                                    <Input
                                        placeholder={gettext("Additional name")}
                                        type="text"
                                        value={valueHeader?.names?.last_name}
                                        allowClear
                                        disabled={disable}
                                        onChange={(e) => {
                                            const value = {
                                                ...valueHeader,
                                                names: {
                                                    ...valueHeader.names,
                                                    last_name: e.target.value,
                                                },
                                            }
                                            
                                            store.setValueHeader(value);
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
                    <Title className="name-site-a" style={colorText} level={1} >{valueHeader?.names?.first_name}</Title>
                    <Title className="name-site-b" style={colorText} level={5} >{valueHeader?.names?.last_name}</Title>
                </div>
            </div>
        </div >
    );
});