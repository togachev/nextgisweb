import { observer } from "mobx-react-lite";

import { authStore } from "@nextgisweb/auth/store";
import { Popover, Button, Space, Divider, Typography } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import i18n from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import { LoginOutlined } from '@ant-design/icons';

import './header.less';

const { Title } = Typography;
const signInText = i18n.gettext("Sign in");

export const Header = observer(() => {
    const { authenticated, invitationSession, userDisplayName } = authStore;

    const content = (
        <>
            {invitationSession && (
                <div className="warning">
                    {i18n.gettext("Invitation session")}
                </div>
            )}
            <a href={routeURL("auth.settings")}>{i18n.gettext("Settings")}</a>
            <a href="#" onClick={() => authStore.logout()}>
                {i18n.gettext("Sign out")}
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
                                            .replace(/(.)[^\s]+(?: (.).*)?/, "$1$2")
                                            .toUpperCase()}
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
                    </Space>
                </div>
            </div>
            <div className="name-site">
                <Title className="name-site-a" level={1} >Геопортал Центра космических услуг</Title>
                <Title className="name-site-b" level={5} >цифровые карты Ханты-мансийского автономного округа - Югры</Title>
            </div>
        </div>
    );
});
