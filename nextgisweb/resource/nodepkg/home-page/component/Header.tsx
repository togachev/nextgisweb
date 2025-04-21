import { CSSProperties, useEffect, useLayoutEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { createPortal } from "react-dom";
import { Rnd } from "react-rnd";
import { authStore } from "@nextgisweb/auth/store";
import { Button, Form, Input, Menu, Space, Typography, Layout } from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import Edit from "@nextgisweb/icon/material/edit";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import MenuIcon from "@nextgisweb/icon/mdi/menu";
import Login from "@nextgisweb/icon/mdi/login";
import Logout from "@nextgisweb/icon/mdi/logout";
import Account from "@nextgisweb/icon/mdi/account";
import AccountCogOutline from "@nextgisweb/icon/mdi/account-cog-outline";
import FolderOutline from "@nextgisweb/icon/mdi/folder-outline";
import Cog from "@nextgisweb/icon/mdi/cog";
import Close from "@nextgisweb/icon/mdi/close";
import { ControlForm, UploadComponent } from ".";

import "./Header.less";

const { Header: LHeader, Footer: LFooter, Content: LContent } = Layout;

type MenuItem = Required<MenuProps>["items"][number];

const { Title } = Typography;
const signInText = gettext("Sign in");

const W = window.innerWidth;
const H = window.innerHeight;

const width = W * 0.65;
const height = H * 0.65;
export interface Rnd {
    x: number;
    y: number;
    width: number;
    height: number;
}
const position: Rnd = {
    x: W > 466 ? W / 2 - width / 2 : 0,
    y: H > 466 ? H / 2 - height / 2 : 0,
    width: W > 466 ? width : W,
    height: H > 466 ? height : H,
};

export const Header = observer(({ store, config }) => {
    const { authenticated, invitationSession, userDisplayName } = authStore;

    const [status, setStatus] = useState(false);
    const [form] = Form.useForm();

    const paramsFileHeader = {
        size: 100, /* KB */
        extension: ".webp",
        type: "image/webp",
        formatName: "WEBP",
        className: "upload-header",
        key: "picture",
        values: "valueHeader",
        valuesInitial: "initialHeader",
        setValues: "setValueHeader",
    };

    const showLoginModal = () => {
        if (oauth.enabled && oauth.default) {
            const qs = new URLSearchParams([["next", window.location.href]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const colorText = { color: store.valueFooter?.colorText };
    const urlResShow = routeURL("resource.show", 0);
    const items: MenuItem[] = [];

    store.valueHeader?.menu?.map((item, index) => items.push({
        key: index,
        label: (<a href={item?.value} target="_blank" rel="noopener noreferrer" style={colorText}>{item?.name}</a>),
        name: item?.name,
        value: item?.value,
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
                    label: <span style={colorText} className="account-name">{userDisplayName}</span>,
                    type: "group",
                },
                {
                    key: "resources",
                    label: (<a href={urlResShow} target="_blank" rel="noopener noreferrer">{gettext("Resources")}</a>),
                    extra: <span style={colorText}><FolderOutline /></span>,
                },
                config.isAdministrator === true && {
                    key: "control-panel",
                    extra: <span style={colorText}><Cog /></span>,
                    label: (<a href="/control-panel" target="_blank" rel="noopener noreferrer">{gettext("Control panel")}</a>),
                },
                invitationSession && {
                    label: (<div className="warning">{gettext("Invitation session")}</div>),
                    key: gettext("Invitation session"),
                },
                {
                    label: (<a target="_blank" rel="noopener noreferrer" href={routeURL("auth.settings")}>{gettext("Settings")}</a>),
                    extra: <span style={colorText}><AccountCogOutline /></span>,
                    key: gettext("Settings"),
                },
                {
                    label: (<a onClick={() => authStore.logout()} className="auth-login">{gettext("Sign out")}</a>),
                    extra: <span style={colorText}><Logout /></span>,
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
    };

    const onFinish = (value) => {
        store.setOpen(false)
        store.setValueHeader(value);
        store.setInitialHeader(value);
        store.saveSetting(value, "home_page_header");
    };

    const onValuesChange = (changedValues: any, values: any) => {
        store.setValueHeader(values)
    };

    useEffect(() => {
        try {
            if (status === true) {
                form.resetFields();
                store.setValueHeader(store.initialHeader);
                store.updateStatusFile("done", "picture", "initialHeader", "valueHeader", "setValueHeader")
            }
        } finally {
            setStatus(false);
        }
    }, [status]);

    const resetForm = () => {
        setStatus(true);
    };

    const openForm = () => {
        store.setValueRnd(position);
        store.setOpen(true)
    };

    const handleCancel = () => {
        setStatus(true);
        store.setOpen(false)
    };

    const urlPicture = store.valueHeader?.picture && store.valueHeader?.picture[0]?.status === "done" ? store.valueHeader?.picture[0]?.url : "";

    const layoutStyle: CSSProperties = {
        overflow: "hidden",
        width: "calc(100%)",
        maxHeight: store.valueRnd?.height,
    };

    useLayoutEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 466) {
                const value = {
                    ...store.valueRnd,
                    x: window.innerWidth / 2 - (window.innerWidth * 0.65) / 2,
                    width: window.innerWidth * 0.65,
                };
                store.setValueRnd(value);
            } else {
                const value = {
                    ...store.valueRnd,
                    x: 0,
                    width: window.innerWidth,
                };
                store.setValueRnd(value);
            }

            if (window.innerHeight >= 466) {
                const value = {
                    ...store.valueRnd,
                    y: window.innerHeight / 2 - (window.innerHeight * 0.65) / 2,
                    height: window.innerHeight * 0.65,
                };
                store.setValueRnd(value);
            } else {
                const value = {
                    ...store.valueRnd,
                    y: 0,
                    height: window.innerHeight,
                };
                store.setValueRnd(value);
            }
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [window.innerWidth, window.innerHeight]);

    return (
        <>
            <div
                className="header-home-page"
                style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(${urlPicture})` }}
            >
                <div className="control-button">
                    {config.isAdministrator === true && !store.open && (<Button
                        className="icon-pensil"
                        title={gettext("Edit")}
                        type="default"
                        icon={<Edit />}
                        onClick={openForm}
                    />)}
                </div>
                <div className="menus">
                    <div className="menu-component">
                        <div className="button-link">
                            <MenuContainer />
                        </div>
                    </div>
                </div>
                <div className="name-site">
                    <div className="title">
                        <Title className="name-site-a" style={colorText} level={1} >{store.valueHeader?.first_name}</Title>
                        <Title className="name-site-b" style={colorText} level={5} >{store.valueHeader?.last_name}</Title>
                    </div>
                </div>
            </div >
            {store.open && createPortal(
                <Rnd
                    className="rnd-style"
                    // minWidth={store.valueRnd.width === W ? W : position.width}
                    // minHeight={store.valueRnd.height === H ? H : position.height}
                    position={{ x: store.valueRnd.x, y: store.valueRnd.y }}
                    size={{ width: store.valueRnd.width, height: store.valueRnd.height }}
                    onDragStop={(e, d) => {
                        if (store.valueRnd.x !== d.x || store.valueRnd.y !== d.y) {
                            const value = { ...store.valueRnd, x: d.x, y: d.y }
                            store.setValueRnd(value);
                        }
                    }}
                    enableResizing={false}
                    bounds="window"
                    cancel=".contentStyle,.footerStyle"
                >
                    <Form
                        form={form}
                        name="ngw_home_page_header"
                        autoComplete="off"
                        initialValues={store.initialHeader}
                        onFinish={onFinish}
                        onValuesChange={onValuesChange}
                        clearOnDestroy={true}
                        style={{ height: "100%" }}
                    >
                        <Layout style={layoutStyle}>
                            <LHeader className="headerStyle">
                                <span className="title-rnd" >Header title</span>
                                <Button
                                    title={gettext("Close")}
                                    type="text"
                                    icon={<Close />}
                                    onClick={handleCancel}
                                />
                            </LHeader>
                            <Layout>
                                <LContent className="contentStyle">
                                    <Space className="content" direction="vertical">
                                        <UploadComponent store={store} params={paramsFileHeader} />
                                        <Form.List name="menu">
                                            {(fields, { add, remove }) => (
                                                <>
                                                    <Space direction="vertical" style={{ width: "100%" }} wrap>
                                                        <Button
                                                            className="item-edit"
                                                            onClick={() => add()}
                                                            icon={<LinkEdit />}
                                                            title={gettext("Add url")}
                                                            type="default"
                                                        >
                                                            {gettext("Add url")}
                                                        </Button>
                                                        {fields.map((field, index) => (
                                                            <Space.Compact block key={index} >
                                                                <Form.Item noStyle name={[field.name, "name"]}>
                                                                    <Input
                                                                        type="text"
                                                                        allowClear
                                                                        placeholder={gettext("Name url")}
                                                                    />
                                                                </Form.Item>
                                                                <Form.Item noStyle name={[field.name, "value"]}>
                                                                    <Input
                                                                        placeholder={gettext("Url")}
                                                                        className="first-input"
                                                                        allowClear
                                                                    />
                                                                </Form.Item>
                                                                <Button
                                                                    title={gettext("Delete url")}
                                                                    onClick={() => {
                                                                        remove(field.name);
                                                                    }}
                                                                    icon={<DeleteOffOutline />}
                                                                    type="default"
                                                                />
                                                            </Space.Compact>
                                                        ))}
                                                    </Space>
                                                </>
                                            )}
                                        </Form.List>
                                        <Form.Item noStyle name={"first_name"}>
                                            <Input
                                                placeholder={gettext("First name site")}
                                                type="text"
                                                allowClear
                                            />
                                        </Form.Item>
                                        <Form.Item noStyle name={"last_name"}>
                                            <Input
                                                placeholder={gettext("Additional name")}
                                                type="text"
                                                allowClear
                                            />
                                        </Form.Item>
                                    </Space>
                                </LContent>
                            </Layout>
                            <LFooter className="footerStyle">
                                <ControlForm handleCancel={handleCancel} resetForm={resetForm} />
                            </LFooter>
                        </Layout>
                    </Form>
                </Rnd>,
                document.body
            )}
        </>
    );
});