import { observer } from "mobx-react-lite";

import { authStore } from "@nextgisweb/auth/store";
import { Popover, Button, Space, Divider, Typography } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import { LoginOutlined } from '@ant-design/icons';
import ResourceGroup from "./icons/resource_group.svg";

import './header.less';

const { Title } = Typography;
const signInText = gettext("Sign in");

export const Header = observer(() => {
    const { authenticated, invitationSession, userDisplayName } = authStore;

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
            const qs = new URLSearchParams([["next", window.location]]);
            window.open(routeURL("auth.oauth") + "?" + qs.toString(), "_self");
        } else {
            authStore.showModal();
        }
    };

    const DividerMenu = () => (
        <Divider type="vertical" style={{ height: "24px", borderColor: "#fff" }} />
    )

    const header_image = routeURL('pyramid.header_image')
    const url = routeURL("resource.show", 0);

    return (
        <div className="header" style={{ background: "linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(" + header_image + ")" }}>
            <div className="menu-button">
                <div className="menu-component">
                    <Space className="button-link">
                        <Button type="link" href="https://uriit.ru/">на главную ЮНИИИТ</Button>
                        <DividerMenu />
                        <Button type="link" href="https://uriit.ru/services/infospace-technologies/">услуги ЦКУ</Button>
                        <DividerMenu />
                        <Button type="link" href="https://uriit.ru/contacts/">контакты</Button>
                        <DividerMenu />

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
                                    icon={<LoginOutlined />}
                                    type="link">{signInText}</Button>
                            ) : (
                                <a href={ngwConfig.logoutUrl}>{signInText}</a>
                            )}
                        </div>
                        {authenticated ?
                            <a title={gettext("Resources")} className="link-resource" href={url}>
                                <span className="res-link">
                                    <ResourceGroup />
                                </span>
                            </a>
                            : null}
                    </Space>
                </div>
            </div>
            <div className="name-site">
                <Title className="name-site-a" level={1} >Геопортал Центра космических услуг</Title>
                <Title className="name-site-b" level={5} >цифровые карты Ханты-мансийского автономного округа - Югры</Title>
            </div>
        </div >
    );
});
