import { useEffect, useState } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "@nextgisweb/auth/store";
import { Button, Form, Input, Menu, Space, Typography } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import MenuIcon from "@nextgisweb/icon/mdi/menu";
import Login from "@nextgisweb/icon/mdi/login";
import Logout from "@nextgisweb/icon/mdi/logout";
import Account from "@nextgisweb/icon/mdi/account";
import AccountCogOutline from "@nextgisweb/icon/mdi/account-cog-outline";
import FolderOutline from "@nextgisweb/icon/mdi/folder-outline";
import Cog from "@nextgisweb/icon/mdi/cog";
import { UploadComponent, ControlForm, ModalComponent } from ".";
import { useReload } from "./useReload";

import type { MenuProps } from "@nextgisweb/gui/antd";
import type { HomeStore } from "../HeaderProps";

import "./Header.less";

type MenuItem = Required<MenuProps>["items"][number];

const { Title } = Typography;
const signInText = gettext("Sign in");

type HeaderProps = {
    store: HomeStore;
}

export const Header = observer(({ store }: HeaderProps) => {
    const { authenticated, invitationSession, userDisplayName } = authStore;
    const [status, setStatus] = useState(false);
    const [open, setOpen] = useState(false);
    const [reload, reloading] = useReload();
    const [form] = Form.useForm();

    const paramsFileHeader = {
        size: 100, /* KB */
        extension: ".webp",
        type: "image/webp",
        formatName: "WEBP",
        className: "upload-header",
        key: "img",
        values: "valueHeader",
        valuesInitial: "initialHeader",
        setValues: "setValueHeader",
        hkey: "header",
    };

    const showLoginModal = () => {
        if (oauth.enabled && oauth.default) {
            const qs = new URLSearchParams([["next", window.location.href]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const colorText = { color: store.valueFooter?.colorText ? store.valueFooter?.colorText : "var(--icon-color)" };

    const urlResShow = routeURL("resource.show", 0);
    const items: MenuItem[] = [];
    const itemsUser: MenuItem[] = [];

    store.valueHeader?.menu?.map((item, index) => items.push({
        key: index,
        label: (<a href={item?.value} target="_blank" rel="noopener noreferrer">{item?.name}</a>),
        name: item?.name,
        value: item?.value,
        className: "menu-label"
    }));

    itemsUser.push({
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
                    label: <span className="account-name">{userDisplayName}</span>,
                    type: "group",
                },
                {
                    key: "resources",
                    label: (<a href={urlResShow} target="_blank" rel="noopener noreferrer">{gettext("Resources")}</a>),
                    icon: <FolderOutline />,
                },
                store.config.isAdministrator === true && {
                    key: "control-panel",
                    icon: <Cog />,
                    label: (<a href="/control-panel" target="_blank" rel="noopener noreferrer">{gettext("Control panel")}</a>),
                },
                invitationSession && {
                    label: (<div className="warning">{gettext("Invitation session")}</div>),
                    key: gettext("Invitation session"),
                },
                {
                    label: (<a target="_blank" rel="noopener noreferrer" href={routeURL("auth.settings")}>{gettext("Settings")}</a>),
                    icon: <AccountCogOutline />,
                    key: gettext("Settings"),
                },
                {
                    label: (<a onClick={() => authStore.logout()} className="auth-login">{gettext("Sign out")}</a>),
                    icon: <Logout />,
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
                overflowedIndicator={<span className="menu-indicator"><MenuIcon /></span>}
                triggerSubMenuAction="click"
            />)
    };

    const MenuUser = () => {
        return (
            <Menu
                selectable={false}
                mode="horizontal"
                items={itemsUser}
                overflowedIndicator={<span className="menu-indicator"><MenuIcon /></span>}
                triggerSubMenuAction="click"
            />)
    };

    const onFinish = (value) => {
        setOpen(false);
        store.setValueHeader(value);
        store.setInitialHeader(value);
        store.saveSetting(value, "home_page_header");
        store.setUrlImg({ ...store.ulrImg, header: value.img ? value.img[0]?.url : "" });
        reload();
    };

    const onValuesChange = (changedValues: any, values: any) => {
        store.setValueHeader(values)
    };

    useEffect(() => {
        try {
            if (status === true) {
                form.resetFields();
                store.setValueHeader(store.initialHeader);
                store.updateStatusFile("done", "img", "initialHeader", "valueHeader", "setValueHeader");
                store.initialHeader?.img && store.initialHeader?.img[0]?.status === "done" ?
                    store.setUrlImg({ ...store.ulrImg, header: routeURL("pyramid.asset.himg", { ikey: "home_page_header" }) }) :
                    store.setUrlImg({ ...store.ulrImg, header: "" });
            }
        } finally {
            setStatus(false);
        }
    }, [status]);

    const resetForm = () => {
        setStatus(true);
    };

    const openForm = () => {
        setOpen(true);
    };

    const handleCancel = () => {
        setStatus(true);
        setOpen(false);
    };

    const formHeader = (
        <Form
            form={form}
            name="ngw_home_page_header"
            autoComplete="off"
            initialValues={store.initialHeader}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
            clearOnDestroy={true}
            className="form-component"
        >
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
                <span className="control-component">
                    <ControlForm handleCancel={handleCancel} resetForm={resetForm} />
                </span>
            </Space>
        </Form>
    )

    return (
        <>
            <div
                className="header-home-page"
                style={reloading ? null : { backgroundImage: `linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(${store.ulrImg?.header ? store.ulrImg.header : ""})` }}
            >
                <div className="control-button">
                    {store.config.isAdministrator === true && !open && (<Button
                        className="icon-pensil"
                        title={gettext("Setting header")}
                        type="text"
                        icon={<Cog />}
                        onClick={openForm}
                    />)}
                </div>
                <div className="header-block">
                    <div className="menu-component">
                        <div className="button-link">
                            <MenuContainer />
                        </div>
                        <div className="user-menu">
                            <MenuUser />
                        </div>
                    </div>
                    <div className="name-site">
                        <div className="title">
                            <Title className="name-site-a" style={colorText} level={1} >{store.valueHeader?.first_name}</Title>
                            <Title className="name-site-b" style={colorText} level={5} >{store.valueHeader?.last_name}</Title>
                        </div>
                    </div>
                </div>
            </div >
            <ModalComponent title={gettext("Header setting")} form={formHeader} open={open} handleCancel={handleCancel} />
        </>
    );
});