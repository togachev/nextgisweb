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
    // const [value, setValue] = useState({
    //     services: {
    //         value: "Услуги Центра космических услуг",
    //         list: {
    //             1: {
    //                 name: "Космический мониторинг лесных ресурсов",
    //                 value:
    //                     "https://uriit.ru/services/122-kosmicheskiy-monitoring-lesnykh-resursov/",
    //             },
    //             2: {
    //                 name: "Расчет площади рыбоводного участка",
    //                 value:
    //                     "https://uriit.ru/services/123-razrabotka-tsifrovoy-karty-rybovodnogo-uchastka/",
    //             },
    //         },
    //     },
    //     address: {
    //         value: "Россия, 628011 Ханты-Мансийск ул. Мира, д. 151",
    //         phone: {
    //             1: {
    //                 name: "Приемная",
    //                 value: "+7 (3467) 360-100",
    //             },
    //             2: {
    //                 name: "Канцелярия",
    //                 value: "+7 (3467) 360-100 доб. 6030",
    //             },
    //             3: {
    //                 name: "Факс",
    //                 value: "+7 (3467) 360-101",
    //             },
    //             4: {
    //                 name: "E-mail",
    //                 value: "OFFICE@URIIT.RU",
    //             },
    //         },
    //     },
    // });
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

    const save = async () => {
        const payload = Object.fromEntries(
            Object.entries(value || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { resource: { footers: payload } },
        });
    };



    return (
        <div className="footer-home-page">
            <div className="footer-info">
                <LogoUriitComp />
                <div className="block-info">
                    <div className="footer-content">
                        {edit ? (
                            <Space align="baseline">{value.services.value}</Space>
                        ) : (
                            <Input
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
                                        <div key={item[0]}>
                                            {edit ? (
                                                <div className="phone-item">
                                                    <span>{item[1]?.name}</span>
                                                    <span>{item[1]?.value}</span>
                                                </div>
                                            ) : (
                                                <div className="item-edit">
                                                    <Input
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
                        {!edit && (
                            <FloatButton
                                tooltip={gettext("Add contacts")}
                                type="primary"
                                style={{ left: 10, bottom: 110, justifyContent: "flex-start" }}
                                onClick={() => {
                                    setValue((prev) => ({
                                        ...prev,
                                        address: {
                                            ...prev.address,
                                            phone: {
                                                ...prev.address.phone,
                                                [Object.keys(prev.address.phone).length + 1]: {
                                                    ...prev.address.phone[
                                                    Object.keys(prev.address.phone).length + 1
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
                        {!edit && (
                            <FloatButton
                                tooltip={gettext("Add urls")}
                                type="primary"
                                style={{ left: 10, bottom: 60, justifyContent: "flex-start" }}
                                onClick={() => {
                                    setValue((prev) => ({
                                        ...prev,
                                        services: {
                                            ...prev.services,
                                            list: {
                                                ...prev.services.list,
                                                [Object.keys(prev.services.list).length + 1]: {
                                                    ...prev.services.list[
                                                    Object.keys(prev.services.list).length + 1
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
                        <FloatButton
                            tooltip={edit ? gettext("Edit footer") : gettext("Save footer")}
                            type="primary"
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