import { useEffect, useState } from "react";
import { Divider, FloatButton, Input, Space } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/uriit_logo.svg";
import { route } from "@nextgisweb/pyramid/api";

import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import ChevronRight from "@nextgisweb/icon/mdi/chevron-right";
import ContentSave from "@nextgisweb/icon/mdi/content-save";
import Pencil from "@nextgisweb/icon/mdi/pencil";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { gettext } from "@nextgisweb/pyramid/i18n";
import "./Footer.less";

const LogoUriitComp = () => (
    <span className="uriit-logo">
        <LogoUriit />
    </span>
);

export const Footer = () => {
    const [edit, setEdit] = useState(true);
    const [value, setValue] = useState({
        services: {
            value: "",
            list: {},
        },
        address: {
            value: "",
            phone: {},
        }
    });

    useEffect(() => {
        route("pyramid.csettings")
            .get({
                query: { pyramid: ["home_page_footer"] },
            })
            .then((data) => {
                if (data.pyramid) {
                    setValue(data.pyramid.home_page_footer);
                }
            });
    }, []);

    const save = async () => {
        const payload = Object.fromEntries(
            Object.entries(value || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { pyramid: { home_page_footer: payload } },
        });
    };

    return (
        <div className="footer-home-page">
            <div className="footer-info">
                <LogoUriitComp />
                <div className="block-info">
                    <div className="footer-content">
                        <div className="service">
                            {edit ? (
                                <Space align="baseline">{value.services.value}</Space>
                            ) : (
                                <Input
                                    placeholder={gettext("Name company")}
                                    disabled={edit}
                                    type="text"
                                    value={value.services.value}
                                    onChange={(e) => {
                                        setValue((prev) => ({
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
                        {getEntries(value.services.list).map((item) => {
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
                                                    setValue((prev) => ({
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
                                                    setValue((prev) => ({
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
                                                    const state = { ...value };
                                                    delete state.services.list[item[0]];
                                                    setValue(state);
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
                                    <Space align="baseline">{value.address.value}</Space>
                                ) : (
                                    <Input
                                        placeholder={gettext("Full address")}
                                        disabled={edit}
                                        type="text"
                                        value={value.address.value}
                                        onChange={(e) => {
                                            setValue((prev) => ({
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
                                {getEntries(value.address.phone).map((item) => {
                                    return (
                                        <>
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
                                                            setValue((prev) => ({
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
                                                            setValue((prev) => ({
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
                                                            const state = { ...value };
                                                            delete state.address.phone[item[0]];
                                                            setValue(state);
                                                        }}
                                                        className="icon-edit"
                                                        title={gettext("Delete contacts")}
                                                    >
                                                        <DeleteOffOutline />
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    )
                                })}
                            </div>
                        </div>
                        {!edit && (
                            <FloatButton
                                tooltip={gettext("Add urls")}
                                type="default"
                                style={{ left: 10, bottom: 110, justifyContent: "flex-start" }}
                                onClick={() => {
                                    setValue((prev) => ({
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
                            <FloatButton
                                tooltip={gettext("Add contacts")}
                                type="default"
                                style={{ left: 10, bottom: 60, justifyContent: "flex-start" }}
                                onClick={() => {
                                    setValue((prev) => ({
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
                        <FloatButton
                            tooltip={edit ? gettext("Edit footer") : gettext("Save footer")}
                            type="default"
                            style={{ left: 10, bottom: 10, justifyContent: "flex-start" }}
                            icon={edit ? <Pencil /> : <ContentSave />}
                            onClick={() => {
                                setEdit(!edit);
                                save()
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="uriit-footer-name">© 2002-{new Date().getFullYear()} АУ «Югорский НИИ информационных технологий»</div>
        </div>
    );
}