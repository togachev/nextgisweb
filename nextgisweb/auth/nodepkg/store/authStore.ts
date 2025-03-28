import { action, observable } from "mobx";

import reactApp from "@nextgisweb/gui/react-app";
import { BaseAPIError, route } from "@nextgisweb/pyramid/api";

import type { Credentials, LoginFormProps } from "../login/type";

class AuthStore {
    @observable.ref accessor loginError = "";
    @observable.ref accessor isLogining = false;
    @observable.ref accessor authenticated = !ngwConfig.isGuest;
    @observable.ref accessor invitationSession = ngwConfig.invitationSession;
    @observable.ref accessor userDisplayName = ngwConfig.userDisplayName;
    @observable.ref accessor isAdministrator = ngwConfig.isAdministrator;
    @observable.ref accessor showLoginModal = true;

    @action
    async login(creds: Credentials) {
        this._logout();
        this._cleanErrors();
        try {
            this.isLogining = true;
            const resp = await route("auth.login_cookies").post({
                json: creds,
            });
            this.authenticated = true;
            this.userDisplayName = resp.display_name;
            return resp;
        } catch (err) {
            if (err instanceof BaseAPIError) {
                this.loginError = err.title;
            }
            throw err;
        } finally {
            this.isLogining = false;
        }
    }

    @action
    logout() {
        this._logout();
        window.open(ngwConfig.logoutUrl, "_self");
    }

    async showModal() {
        const { loginModal } = await import("../login");
        loginModal();
    }

    @action
    async runApp(props: LoginFormProps, el: HTMLDivElement) {
        this.showLoginModal = false; // Do not show new modal on "Sign in" click
        const { LoginBox } = await import("../login");
        reactApp(LoginBox, props, el);
    }

    @action
    _logout() {
        this.authenticated = false;
        this.userDisplayName = "";
    }

    @action
    _cleanErrors() {
        this.loginError = "";
    }
}

export const authStore = new AuthStore();
