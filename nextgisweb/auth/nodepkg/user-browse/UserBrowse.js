import { useMemo, useState } from "react";

import { Alert, Badge, Button, Tooltip } from "@nextgisweb/gui/antd";
import { utc } from "@nextgisweb/gui/dayjs";
import { ModelBrowse } from "@nextgisweb/gui/model-browse";
import { route } from "@nextgisweb/pyramid/api";
import { gettext } from "@nextgisweb/pyramid/i18n";

import { makeTeamManageButton, default as oauth } from "../oauth";

import AdministratorIcon from "@nextgisweb/icon/material/local_police";
import RegularUserIcon from "@nextgisweb/icon/material/person";

const msgDisabled = gettext("Disabled");
const msgEnabled = gettext("Enabled");
const messages = {
    deleteConfirm: gettext("Delete user?"),
    deleteSuccess: gettext("User deleted"),
};

const columns = [];

columns.push({
    title: gettext("Full name"),
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

columns.push({
    title: gettext("Login"),
    dataIndex: "keyname",
    key: "keyname",
    sorter: (a, b) => (a.keyname > b.keyname ? 1 : -1),
});

if (oauth.enabled) {
    columns.push({
        title: // prettier-ignore
            <Tooltip title={gettext("Users with a password can sign in with login and password.")}>
                {gettext("Password")}
            </Tooltip>,
        dataIndex: "password",
        render: (value) => (value ? gettext("Yes") : gettext("No")),
        sorter: (a, b) => (a.password > b.password ? 1 : -1),
    });

    columns.push({
        title: // prettier-ignore
            <Tooltip title={gettext("Users bound to {dn} can sign in with {dn}.").replaceAll('{dn}', oauth.name)}>
                {oauth.name}
            </Tooltip>,
        dataIndex: "oauth_subject",
        render: (value) => (value ? gettext("Yes") : gettext("No")),
        sorter: (a, b) => (!!a.oauth_subject > !!b.oauth_subject ? 1 : -1),
    });
}

columns.push({
    title: gettext("Last activity"),
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

columns.push({
    title: gettext("Status"),
    dataIndex: "disabled",
    key: "disabled",
    render: (text) => {
        return text ? msgDisabled : msgEnabled;
    },
    sorter: (a, b) => (a.disabled > b.disabled ? 1 : -1),
});

export function UserBrowse() {
    const [toggleLoading, setToggleLoading] = useState(false);

    const ToggleSelectedUsers = ({ disable, selected, rows, setRows }) => {
        const usersToToggle = [];
        for (const r of rows) {
            if (
                selected.includes(r.id) &&
                (disable ? !r.disabled : r.disabled)
            ) {
                usersToToggle.push(r.id);
            }
        }
        if (!usersToToggle.length) {
            return null;
        }

        const toggleUser = async () => {
            setToggleLoading(true);
            const toggledUsers = [];
            for (const u of usersToToggle) {
                try {
                    const json = {
                        disabled: disable,
                    };
                    await route("auth.user.item", u).put({
                        json,
                    });
                    toggledUsers.push(u);
                } catch {
                    // ignore
                }
            }
            const newRows = [];
            for (const r of rows) {
                if (toggledUsers.includes(r.id)) {
                    const newRow = { ...r };
                    newRow.disabled = disable;
                    newRows.push(newRow);
                } else {
                    newRows.push(r);
                }
            }
            setToggleLoading(false);
            setRows(newRows);
        };

        return (
            <Badge
                count={toggleLoading ? 0 : usersToToggle.length}
                size="small"
                key={
                    disable ? "DisableSelectedControl" : "EnableSelectedControl"
                }
            >
                <Button onClick={toggleUser} loading={toggleLoading}>
                    {disable ? gettext("Disable") : gettext("Enable")}
                </Button>
            </Badge>
        );
    };

    const DisableSelectedUsers = (props) => {
        return ToggleSelectedUsers({ disable: true, ...props });
    };
    const EnableSelectedUsers = (props) => {
        return ToggleSelectedUsers({ disable: false, ...props });
    };

    // prettier-ignore
    const infoNGID = useMemo(() => oauth.isNGID && <Alert
        type="info" style={{marginTop: "1ex"}}
        message={gettext("Your team members won't be shown here until their first logon. Set \"New users\" flag for a group to automatically assign new user to this group. You may also modify permission for authenticated users to manage access for your team members.").replace("{name}", oauth.name)}
    />, []);

    const tmBtn = makeTeamManageButton({ target: "_blank" });

    return (
        <div className="ngw-auth-user-browse">
            <ModelBrowse
                model="auth.user"
                columns={columns}
                messages={messages}
                collectionOptions={{ query: { brief: true } }}
                collectionFilter={(itm) => !itm.system}
                headerControls={(tmBtn && [() => tmBtn]) || []}
                selectedControls={[EnableSelectedUsers, DisableSelectedUsers]}
            />
            {infoNGID}
        </div>
    );
}
