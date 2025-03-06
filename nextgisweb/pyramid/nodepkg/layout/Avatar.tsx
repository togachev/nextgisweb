import { observer } from "mobx-react-lite";

import oauth from "@nextgisweb/auth/oauth";
import { authStore } from "@nextgisweb/auth/store";
import { Popover } from "@nextgisweb/gui/antd";
import { routeURL } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ResourceFavoriteAvatar } from "@nextgisweb/resource/favorite/Avatar";
import Account from "@nextgisweb/icon/mdi/account";

import "./Avatar.less";

const msgSignIn = gettext("Sign in");

export const Avatar = observer(() => {
    const { authenticated, invitationSession, userDisplayName } = authStore;

    const content = (
        <>
            {invitationSession && (
                <div className="warning">{gettext("Invitation session")}</div>
            )}
            <ResourceFavoriteAvatar />
            <a href={routeURL("auth.settings")}>{gettext("User settings")}</a>
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

    return (
        <div
            className={
                "ngw-pyramid-avatar" +
                (authenticated ? " ngw-pyramid-avatar-authenticated" : "") +
                (invitationSession ? " ngw-pyramid-avatar-danger" : "")
            }
        >
            {authenticated ? (
                <Popover
                    placement="bottomRight"
                    trigger="click"
                    title={userDisplayName}
                    content={content}
                    overlayClassName="ngw-pyramid-avatar-popover"
                    arrow={{ pointAtCenter: true }}
                >
                    <span className="ngw-pyramid-menu-icon">
                        <Account />
                    </span>
                </Popover>
            ) : authStore.showLoginModal ? (
                <a onClick={showLoginModal}>{msgSignIn}</a>
            ) : (
                <a href={ngwConfig.logoutUrl}>{msgSignIn}</a>
            )}
        </div>
    );
});
