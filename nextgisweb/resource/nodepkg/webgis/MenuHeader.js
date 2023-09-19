import { observer } from "mobx-react-lite";

import { authStore } from "@nextgisweb/auth/store";
import { Popover, Button, Space, Divider } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import i18n from "@nextgisweb/pyramid/i18n";
import oauth from "@nextgisweb/auth/oauth";
import { LoginOutlined } from '@ant-design/icons';

import "./MenuHeader.less";

const signInText = i18n.gettext("Sign in");

export const MenuHeader = observer(() => {
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

    return (
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
                            placement="bottomRight"
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

    );
});
