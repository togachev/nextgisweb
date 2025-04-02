import { useState } from "react";
import { observer } from "mobx-react-lite";
import { authStore } from "@nextgisweb/auth/store";
import { Button, Col, Form, Input, Menu, Row, Typography } from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
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
import Cancel from "@nextgisweb/icon/mdi/cancel";
import Restore from "@nextgisweb/icon/mdi/restore";
import FolderOutline from "@nextgisweb/icon/mdi/folder-outline";
import Cog from "@nextgisweb/icon/mdi/cog";
import { HomeStore } from "./HomeStore";
import { UploadComponent } from "./component/UploadComponent";

import "./Header.less";

type MenuItem = Required<MenuProps>["items"][number];

const { Title } = Typography;
const signInText = gettext("Sign in");

export const Header = observer(({ store: storeProp, config }) => {
    const { authenticated, invitationSession, userDisplayName } = authStore;

    const [disable, setDisable] = useState(true);
    const [form] = Form.useForm();
    const [store] = useState(
        () => storeProp || new HomeStore()
    );

    const paramsFileHeader = {
        size: 100, /* KB */
        extension: ".webp",
        type: "image/webp",
        formatName: "WEBP",
        className: "upload-header",
        styleImage: {
            margin: "0 0 0 16px",
        },
        key: "picture",
        values: "valueHeader",
        valuesInitial: "initialHeader",
        setValues: "setValueHeader",
    }

    const showLoginModal = () => {
        if (oauth.enabled && oauth.default) {
            const qs = new URLSearchParams([["next", window.location.href]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const colorText = { color: store.valueFooter?.colorText }

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
    }

    const onFinish = (value) => {
        console.log(value);
        
        setDisable(!disable);
        store.setValueHeader(value);
        store.setInitialHeader(store.valueHeader);
        store.saveSetting(store.valueHeader, "home_page_header");
    }

    const cancelForm = () => {
        setDisable(!disable);
    };

    const resetForm = () => {
        form.resetFields();
        store.getValuesHeader("loading");
    };

    const applyForm = () => {
        store.setValueHeader(form.getFieldsValue());
    };

    const openForm = () => {
        setDisable(!disable);
    }

    const urlPicture = store.valueHeader?.picture && store.valueHeader?.picture[0]?.status === "done" ? store.valueHeader?.picture[0]?.url : ""

    return (
        <div className="header-home-page"
        style={{ backgroundImage: `linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(${urlPicture})` }}
        >
            <div className="control-button">
                {config.isAdministrator === true && disable && (<Button
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
            {!disable && (
                <Form
                    form={form}
                    name="ngw_home_page_header"
                    autoComplete="off"
                    initialValues={store.valueHeader}
                    onFinish={onFinish}
                    clearOnDestroy={true}
                >

                    <Row className="header-info-edit form-padding">
                        <Col flex="auto">
                            <Row gutter={[16, 16]} className="item-edit" justify="end">
                                <Col flex="none">
                                    <UploadComponent store={store} params={paramsFileHeader} />
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} className="item-edit">
                                <Col flex="auto">
                                    <Form.List name="menu">
                                        {(fields, { add, remove }) => (
                                            <>
                                                <Row gutter={[16, 16]} justify="end">
                                                    <Col>
                                                        <Button
                                                            className="item-edit"
                                                            onClick={() => add()}
                                                            icon={<LinkEdit />}
                                                            title={gettext("Add url")}
                                                            type="default"
                                                        >
                                                            {gettext("Add url")}
                                                        </Button>
                                                    </Col>
                                                </Row>
                                                {fields.map((field, index) => (
                                                    <Row key={index} gutter={[16, 16]} wrap={false} className="item-edit">
                                                        <Col flex="auto">
                                                            <Form.Item noStyle name={[field.name, "name"]}>
                                                                <Input
                                                                    type="text"
                                                                    allowClear
                                                                    placeholder={gettext("Name url")}
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col flex="auto">
                                                            <Form.Item noStyle name={[field.name, "value"]}>
                                                                <Input
                                                                    placeholder={gettext("Url")}
                                                                    className="first-input"
                                                                    allowClear
                                                                />
                                                            </Form.Item>
                                                        </Col>
                                                        <Col flex="none">
                                                            <Button
                                                                title={gettext("Delete url")}
                                                                onClick={() => {
                                                                    remove(field.name);
                                                                }}
                                                                icon={<DeleteOffOutline />}
                                                                type="default"
                                                            />
                                                        </Col>
                                                    </Row>
                                                ))}
                                            </>
                                        )}
                                    </Form.List>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} className="item-edit">
                                <Col flex="auto">
                                    <Form.Item noStyle name={"first_name"}>
                                        <Input
                                            placeholder={gettext("First name site")}
                                            type="text"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} className="item-edit">
                                <Col flex="auto">
                                    <Form.Item noStyle name={"last_name"}>
                                        <Input
                                            placeholder={gettext("Additional name")}
                                            type="text"
                                            allowClear
                                        />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} justify="end">
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        {!disable && (
                                            <Button
                                                title={gettext("Cancel")}
                                                type="default"
                                                icon={<Cancel />}
                                                onClick={cancelForm}
                                            >
                                                {gettext("Cancel")}
                                            </Button>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        {!disable && (
                                            <Button
                                                title={gettext("Reset")}
                                                type="default"
                                                icon={<Restore />}
                                                onClick={resetForm}
                                            >
                                                {gettext("Reset")}
                                            </Button>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        <Button
                                            type="default"
                                            onClick={applyForm}
                                            icon={<Save />}
                                            title={gettext("Apply")}
                                        >
                                            {gettext("Apply")}
                                        </Button>
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        <Button
                                            type="default"
                                            htmlType="submit"
                                            icon={<Save />}
                                            title={gettext("Save")}
                                        >
                                            {gettext("Save")}
                                        </Button>
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Form>
            )}
        </div >
    );
});