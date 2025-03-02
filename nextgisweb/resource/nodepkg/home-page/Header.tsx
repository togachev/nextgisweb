import { observer } from "mobx-react-lite";
import { authStore } from "@nextgisweb/auth/store";
import { Button, Divider, Input, Popover, Typography } from "@nextgisweb/gui/antd";
import { route, routeURL } from "@nextgisweb/pyramid/api";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { gettext } from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import Folder from "@nextgisweb/icon/mdi/folder";
import LoginVariant from "@nextgisweb/icon/mdi/login-variant";

import "./Header.less";

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

    const content = (
        <>
            {invitationSession && (
                <div className="warning">
                    {gettext("Invitation session")}
                </div>
            )}
            <a href={routeURL("auth.settings")}>{gettext("Settings")}</a>
            <a href="#" onClick={() => authStore.logout()}>
                {gettext("Sign out")}
            </a>
        </>
    );

    const showLoginModal = () => {
        if (oauth.enabled && oauth.default) {
            const qs = new URLSearchParams([["next", window.location.href]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const DividerMenu = () => (
        <Divider type="vertical" style={{ height: "24px", borderColor: "#fff" }} />
    )

    const header_image = routeURL("pyramid.asset.header_image")
    const url = routeURL("resource.show", 0);

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
                        {valueHeader?.menus?.menu && getEntries(valueHeader.menus.menu).map((item) => {
                            return (
                                <div key={item[0]} className="menu-link">
                                    {editHeader ? (
                                        <Button type="link" href={item[1]?.value}>{item[1]?.name}</Button>
                                    ) : (
                                        <div className="item-edit">
                                            <Input
                                                placeholder={gettext("Name url")}
                                                type="text"
                                                value={item[1]?.name}
                                                allowClear
                                                disabled={editHeader}
                                                onChange={(e) => {
                                                    setValueHeader((prev) => ({
                                                        ...prev,
                                                        menus: {
                                                            ...prev.menus,
                                                            menu: {
                                                                ...prev.menus.menu,
                                                                [item[0]]: {
                                                                    ...prev.menus.menu[item[0]],
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
                                                value={item[1]?.value}
                                                allowClear
                                                disabled={editHeader}
                                                onChange={(e) => {
                                                    setValueHeader((prev) => ({
                                                        ...prev,
                                                        menus: {
                                                            ...prev.menus,
                                                            menu: {
                                                                ...prev.menus.menu,
                                                                [item[0]]: {
                                                                    ...prev.menus.menu[item[0]],
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
                                                    delete state.menus.menu[item[0]];
                                                    setValueHeader(state);
                                                }}
                                                className="icon-edit"
                                                icon={<DeleteOffOutline />}
                                            />
                                        </div>
                                    )}
                                    {editHeader && <DividerMenu />}
                                </div>
                            )
                        })}
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
                    <div
                        className={
                            "menu-avatar" +
                            (authenticated ? " menu-avatar-authenticated" : "") +
                            (invitationSession ? " menu-avatar-danger" : "")
                        }
                    >
                        {authenticated ? (
                            <Popover
                                placement="bottom"
                                trigger="click"
                                title={userDisplayName}
                                content={content}
                                overlayClassName="menu-avatar-popover"
                                arrow={{ pointAtCenter: true }}
                            >
                                <div className="menu-avatar-label">
                                    {userDisplayName
                                        // .replace(/(.)[^\s]+(?: (.).*)?/, "$1$2")
                                        // .toLowerCase()
                                    }
                                </div>
                            </Popover>
                        ) : authStore.showLoginModal ? (
                            <Button onClick={showLoginModal}
                                icon={<LoginVariant />}
                                type="link">{signInText}</Button>
                        ) : (
                            <a href={ngwConfig.logoutUrl}>{signInText}</a>
                        )}
                    </div>
                    {authenticated ?
                        <a title={gettext("Resources")} className="link-resource" href={url}>
                            <span className="res-link">
                                <Folder />
                            </span>
                        </a>
                        : null}
                </div>
            </div>
            <div className="name-site">
                <div className="title">
                    <Title ellipsis={{ suffix: "" }} className="name-site-a" level={1} >{valueHeader?.names?.first_name}</Title>
                    <Title ellipsis={{ suffix: "" }} className="name-site-b" level={5} >{valueHeader?.names?.last_name}</Title>
                </div>
            </div>
        </div >
    );
});
