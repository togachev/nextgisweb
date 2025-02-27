import { useEffect, useState } from "react";
import { Divider, Button, Input, Space } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/uriit_logo.svg";
import { route } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import ChevronRight from "@nextgisweb/icon/mdi/chevron-right";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./Footer.less";
import { HomeStore } from "./HomeStore";
const LogoUriitComp = () => (
    <span className="uriit-logo">
        <LogoUriit />
    </span>
);

export const Footer = observer(({ config }) => {
    const [edit, setEdit] = useState(true);
    const [store] = useState(
        () => new HomeStore({
            valueFooter: {
                services: {
                    value: "",
                    list: {},
                },
                address: {
                    value: "",
                    phone: {},
                }
            },
        }));

    const {
        valueFooter,
        setValueFooter,
    } = store;

    useEffect(() => {
        route("pyramid.csettings")
            .get({
                query: { pyramid: ["home_page_footer"] },
            })
            .then((data) => {
                if (data.pyramid) {
                    setValueFooter(data.pyramid.home_page_footer);
                }
            });
    }, []);

    const save = async () => {
        const payload = Object.fromEntries(
            Object.entries(valueFooter || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { pyramid: { home_page_footer: payload } },
        });
    };

    return (
        <div className="footer-home-page">
            <div className="control-button">
                {config.isAdministrator === true && (<Button
                    size="small"
                    shape="square"
                    title={edit ? gettext("Edit footer") : gettext("Save footer")}
                    type="default"
                    icon={edit ? <Edit /> : <Save />}
                    onClick={() => {
                        setEdit(!edit);
                        save()
                    }}
                />)}
                {!edit && (
                    <Button
                        size="small"
                        shape="square"
                        title={gettext("Add urls")}
                        type="default"
                        onClick={() => {
                            setValueFooter((prev) => ({
                                ...prev,
                                services: {
                                    ...prev.services,
                                    list: {
                                        ...prev.services.list,
                                        [String(Object.keys(prev.services.list).length + 1)]: {
                                            ...prev.services.list[
                                            String(Object.keys(prev.services.list).length + 1)
                                            ],
                                            name: "",
                                            value: "",
                                        },
                                    },
                                },
                            }));
                        }}
                        icon={<LinkEdit />}
                    />
                )}
                {!edit && (
                    <Button
                        size="small"
                        shape="square"
                        title={gettext("Add contacts")}
                        type="default"
                        onClick={() => {
                            setValueFooter((prev) => ({
                                ...prev,
                                address: {
                                    ...prev.address,
                                    phone: {
                                        ...prev.address.phone,
                                        [String(Object.keys(prev.address.phone).length + 1)]: {
                                            ...prev.address.phone[
                                            String(Object.keys(prev.address.phone).length + 1)
                                            ],
                                            name: "",
                                            value: "",
                                        },
                                    },
                                },
                            }));
                        }}
                        icon={<CardAccountPhone />}
                    />
                )}
            </div>
            <div className="footer-info">
                <LogoUriitComp />
                <div className="block-info">
                    <div className="footer-content">
                        <div className="service">
                            {edit ? (
                                <Space align="baseline">{valueFooter.services.value}</Space>
                            ) : (
                                <Input
                                    placeholder={gettext("Name company")}
                                    disabled={edit}
                                    type="text"
                                    value={valueFooter.services.value}
                                    onChange={(e) => {
                                        setValueFooter((prev) => ({
                                            ...prev,
                                            services: {
                                                ...prev.services,
                                                value: e.target.value,
                                            },
                                        }));
                                    }}
                                />
                            )}
                        </div>
                        {getEntries(valueFooter.services.list).map((item) => {
                            return (
                                <div key={item[0]} className="services-list">
                                    {edit ? (
                                        <span className="services-url">
                                            <a href={item[1]?.value} target="_blank">
                                                <span className="icon-link">
                                                    <ChevronRight />
                                                </span>
                                                {item[1]?.name}
                                            </a>
                                        </span>
                                    ) : (
                                        <div className="item-edit">
                                            <Input
                                                placeholder={gettext("Name url")}
                                                type="text"
                                                value={item[1]?.name}
                                                disabled={edit}
                                                onChange={(e) => {
                                                    setValueFooter((prev) => ({
                                                        ...prev,
                                                        services: {
                                                            ...prev.services,
                                                            list: {
                                                                ...prev.services.list,
                                                                [item[0]]: {
                                                                    ...prev.services.list[item[0]],
                                                                    name: e.target.value,
                                                                },
                                                            },
                                                        },
                                                    }));
                                                }}
                                            />
                                            <Input
                                                placeholder={gettext("Url")}
                                                type="text"
                                                value={item[1]?.value}
                                                disabled={edit}
                                                onChange={(e) => {
                                                    setValueFooter((prev) => ({
                                                        ...prev,
                                                        services: {
                                                            ...prev.services,
                                                            list: {
                                                                ...prev.services.list,
                                                                [item[0]]: {
                                                                    ...prev.services.list[item[0]],
                                                                    value: e.target.value,
                                                                },
                                                            },
                                                        },
                                                    }));
                                                }}
                                            />
                                            <span
                                                onClick={() => {
                                                    const state = { ...valueFooter };
                                                    delete state.services.list[item[0]];
                                                    setValueFooter(state);
                                                }}
                                                className="icon-edit"
                                                title={gettext("Delete urls")}
                                            >
                                                <DeleteOffOutline />
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                        <Divider />
                        <div className={!edit ? "address-edit" : "address-content"}>
                            <div className="address">
                                {edit ? (
                                    <Space align="baseline">{valueFooter.address.value}</Space>
                                ) : (
                                    <Input
                                        placeholder={gettext("Full address")}
                                        disabled={edit}
                                        type="text"
                                        value={valueFooter.address.value}
                                        onChange={(e) => {
                                            setValueFooter((prev) => ({
                                                ...prev,
                                                address: {
                                                    ...prev.address,
                                                    value: e.target.value,
                                                },
                                            }));
                                        }}
                                    />
                                )}
                            </div>
                            <div className="phone">
                                {getEntries(valueFooter.address.phone).map((item) => {
                                    return (
                                        <div key={item[0]}>
                                            {edit ? (
                                                <div key={item[0]} className="phone-item">
                                                    <div className="name">{item[1]?.name}</div>
                                                    <div className="value">{item[1]?.value}</div>
                                                </div>
                                            ) : (
                                                <div key={item[0]} className="item-edit">
                                                    <Input
                                                        placeholder={gettext("Name contacts")}
                                                        type="text"
                                                        value={item[1]?.name}
                                                        disabled={edit}
                                                        onChange={(e) => {
                                                            setValueFooter((prev) => ({
                                                                ...prev,
                                                                address: {
                                                                    ...prev.address,
                                                                    phone: {
                                                                        ...prev.address.phone,
                                                                        [item[0]]: {
                                                                            ...prev.address.phone[item[0]],
                                                                            name: e.target.value,
                                                                        },
                                                                    },
                                                                },
                                                            }));
                                                        }}
                                                    />
                                                    <Input
                                                        placeholder={gettext("Number phone")}
                                                        type="text"
                                                        value={item[1]?.value}
                                                        disabled={edit}
                                                        onChange={(e) => {
                                                            setValueFooter((prev) => ({
                                                                ...prev,
                                                                address: {
                                                                    ...prev.address,
                                                                    phone: {
                                                                        ...prev.address.phone,
                                                                        [item[0]]: {
                                                                            ...prev.address.phone[item[0]],
                                                                            value: e.target.value,
                                                                        },
                                                                    },
                                                                },
                                                            }));
                                                        }}
                                                    />
                                                    <span
                                                        onClick={() => {
                                                            const state = { ...valueFooter };
                                                            delete state.address.phone[item[0]];
                                                            setValueFooter(state);
                                                        }}
                                                        className="icon-edit"
                                                        title={gettext("Delete contacts")}
                                                    >
                                                        <DeleteOffOutline />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
            <div className="uriit-footer-name">© 2002-{new Date().getFullYear()} АУ «Югорский НИИ информационных технологий»</div>
        </div>
    );
})