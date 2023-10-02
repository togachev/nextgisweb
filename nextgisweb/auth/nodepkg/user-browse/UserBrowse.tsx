import { useMemo, useCallback } from "react";

import { Alert, Tooltip } from "@nextgisweb/gui/antd";
import { utc } from "@nextgisweb/gui/dayjs";
import { ModelBrowse } from "@nextgisweb/gui/model-browse";

import { gettext } from "@nextgisweb/pyramid/i18n";

import AdministratorIcon from "@nextgisweb/icon/material/local_police";
import RegularUserIcon from "@nextgisweb/icon/material/person";

import { makeTeamManageButton, default as oauth } from "../oauth";
import { ToggleSelectedUsers } from "./component/ToggleSelectedUsers";

import type { ControlProps } from "@nextgisweb/gui/model-browse/ModelBrowse";
import type { TableProps } from "@nextgisweb/gui/antd";
import type { UserBrowseData } from "./type";

type Col = NonNullable<TableProps["columns"]>[0];

const msgDisabled = gettext("Disabled");
const msgEnabled = gettext("Enabled");
const msgFullName = gettext("Full name");
const msgLogin = gettext("Login");
// eslint-disable-next-line prettier/prettier
const msgPasswordTooltip = gettext("Users with a password can sign in with login and password.");
const msgPassword = gettext("Password");
const msgYes = gettext("Yes");
const msgNo = gettext("No");
// eslint-disable-next-line prettier/prettier
const msgOauthTooltip = gettext("Users bound to {dn} can sign in with {dn}.").replaceAll("{dn}", oauth.name);
const msgLastActivity = gettext("Last activity");
const msgStatus = gettext("Status");
const messages = {
    deleteConfirm: gettext("Delete user?"),
    deleteSuccess: gettext("User deleted"),
};

const createFullNameColumn = (): Col => ({
    title: msgFullName,
    dataIndex: "display_name",
    key: "display_name",
    render: (text, record) => (
        <>
            {record.is_administrator ? (
                <AdministratorIcon />
            ) : (
                <RegularUserIcon />
            )}{" "}
            {text}
        </>
    ),
    sorter: (a, b) => (a.display_name > b.display_name ? 1 : -1),
});

const createLoginColumn = (): Col => ({
    title: msgLogin,
    dataIndex: "keyname",
    key: "keyname",
    sorter: (a, b) => (a.keyname > b.keyname ? 1 : -1),
});

const createOauthColumns = (): Col[] => [
    {
        title: <Tooltip title={msgPasswordTooltip}>{msgPassword}</Tooltip>,
        dataIndex: "password",
        render: (value) => (value ? msgYes : msgNo),
        sorter: (a, b) => (a.password > b.password ? 1 : -1),
    },
    {
        title: <Tooltip title={msgOauthTooltip}>{oauth.name}</Tooltip>,
        dataIndex: "oauth_subject",
        render: (value) => (value ? msgYes : msgNo),
        sorter: (a, b) => (!!a.oauth_subject > !!b.oauth_subject ? 1 : -1),
    },
];

const createLastActivityColumn = (): Col => ({
    title: msgLastActivity,
    dataIndex: "last_activity",
    key: "last_activity",
    sorter: (a, b) => {
        const [al, bl] = [a.last_activity, b.last_activity].map((l) =>
            l ? new Date(l).getTime() : 0
        );
        return al - bl;
    },
    render: (text) => (text ? utc(text).local().format("L LTS") : ""),
});

const createStatusColumn = (): Col => ({
    title: msgStatus,
    dataIndex: "disabled",
    key: "disabled",
    render: (text) => (text ? msgDisabled : msgEnabled),
    sorter: (a, b) => (a.disabled > b.disabled ? 1 : -1),
});

const columns: TableProps["columns"] = [
    createFullNameColumn(),
    createLoginColumn(),
    ...(oauth.enabled ? createOauthColumns() : []),
    createLastActivityColumn(),
    createStatusColumn(),
];

export function UserBrowse() {
    const DisableSelectedUsers = (props: ControlProps<UserBrowseData>) => {
        return ToggleSelectedUsers({ disable: true, ...props });
    };
    const EnableSelectedUsers = (props: ControlProps<UserBrowseData>) => {
        return ToggleSelectedUsers({ disable: false, ...props });
    };

    // prettier-ignore
    const infoNGID = useMemo(() => oauth.isNGID && <Alert
        type="info" style={{marginTop: "1ex"}}
        message={gettext("Your team members won't be shown here until their first logon. Set \"New users\" flag for a group to automatically assign new user to this group. You may also modify permission for authenticated users to manage access for your team members.").replace("{name}", oauth.name)}
    />, []);

    const tmBtn = makeTeamManageButton({ target: "_blank" });

    const collectionFilter = useCallback(
        (itm: UserBrowseData) => !itm.system,
        []
    );

    return (
        <div className="ngw-auth-user-browse">
            <ModelBrowse
                model="auth.user"
                columns={columns}
                messages={messages}
                collectionOptions={{ query: { brief: true } }}
                collectionFilter={collectionFilter}
                headerControls={(tmBtn && [() => tmBtn]) || []}
                selectedControls={[EnableSelectedUsers, DisableSelectedUsers]}
            />
            {infoNGID}
        </div>
    );
}
