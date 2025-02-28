import { useEffect, useState } from "react";
import { Button, ColorPicker, Divider, Image, Input, message, Space, Typography, Upload } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/uriit_logo.svg";
import { route } from "@nextgisweb/pyramid/api";
import { observer } from "mobx-react-lite";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import UploadOutline from "@nextgisweb/icon/mdi/upload-outline";
import ChevronRight from "@nextgisweb/icon/mdi/chevron-right";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { GetProp, UploadFile, UploadProps } from "@nextgisweb/gui/antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

const { Dragger } = Upload;
const { Text } = Typography;

import "./Footer.less";

const selectFile = gettext("Select File");

const LogoUriitComp = ({ store }) => {

    const {
        edit,
        valueFooter,
        setValueFooter,
    } = store;

    const TYPE_FILE = [
        {
            label: "SVG",
            title: "SVG",
            value: "image/svg+xml",
            extension: ".svg",
            disabled: false,
        },
    ];

    const getBase64 = async (file: FileType, callback: (url: string) => void) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => callback(reader.result as string));
        reader.readAsDataURL(file as Blob);
    };

    const props: UploadProps = {
        customRequest: async (options) => {
            const { onSuccess, onError, file } = options;
            try {
                await getBase64(file as FileType, (url) => {
                    setValueFooter((prev) => ({
                        ...prev,
                        logo: {
                            ...prev.logo,
                            value: [{
                                url: url,
                                name: file.name,
                                value: file.uid,
                            }],
                        },
                    }));
                });

                if (onSuccess) {
                    onSuccess("Ok");
                }
            } catch (err) {
                if (onError) {
                    onError(new Error("Exception download"));
                }
            }
        },
        onChange: ({ fileList }) => {
            setValueFooter((prev) => ({
                ...prev,
                logo: {
                    ...prev.logo,
                    value: fileList,
                },
            }));
        },
        defaultFileList: valueFooter?.logo?.value,
        multiple: false,
        beforeUpload: (file, info) => {
            const fileName = file.name;
            const extension = fileName.slice(fileName.lastIndexOf("."));

            const isValidType = TYPE_FILE.some((e) => e.extension === extension);
            const isMaxCount = info.length <= 1;

            const isLimitVolume = file.size / 1024 < 2;
            if (!isLimitVolume) {
                message.error("Exceeding the volume of 2mb");
            }
            return (isValidType && isMaxCount && isLimitVolume) || Upload.LIST_IGNORE;
        },
        maxCount: 1,
        listType: "picture",
        name: "file",
        onRemove: (file) => {
            setValueFooter((prev) => ({
                ...prev,
                logo: {
                    ...prev.logo,
                    value: prev.logo.value.filter((item) => item.uid !== file.uid),
                },
            }));
        }
    };

    const onChangeColorLogo = (c) => {
        setValueFooter((prev) => ({
            ...prev,
            logo: {
                ...prev.logo,
                colorLogo: c.toHexString(),
            },
        }));
    }

    const onChangeColorBackground = (c) => {
        console.log(c.toCssString(),
        c.toHsbString(),
        c.equals())
        
        setValueFooter((prev) => ({
            ...prev,
            logo: {
                ...prev.logo,
                colorBackground: c.toHexString(),
            },
        }));
    }

    return (
        <>
            {!edit ?
                <><Upload {...props} accept=".svg">
                    <Button icon={<UploadOutline />}>{selectFile}</Button>
                </Upload>
                    <ColorPicker value={valueFooter?.logo?.colorLogo} onChange={onChangeColorLogo} />
                    <ColorPicker value={valueFooter?.logo?.colorBackground} onChange={onChangeColorBackground} />
                </> :
                valueFooter?.logo?.value.length > 0 &&
                // <img style={{ fill: valueFooter?.logo?.colorLogo }} className="uriit-logo" src={valueFooter?.logo?.value[0].url} />
                // <img id="logo" style={{ fill: valueFooter?.logo?.colorLogo }} src={valueFooter?.logo?.value[0].url} />
                <Image preview={false} style={{ fill: valueFooter?.logo?.colorLogo }} className="uriit-logo" src={valueFooter?.logo?.value[0].url} />
            }
        </>
    );
};

export const Footer = observer(({ store, config }) => {

    const {
        edit,
        setEdit,
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
                    if (Object.keys(data.pyramid.home_page_footer).length > 0) {
                        setValueFooter(data.pyramid.home_page_footer);
                    }
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
        <div className="footer-home-page" style={{ backgroundColor: store.valueFooter.logo.colorBackground }}>
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
                <LogoUriitComp store={store} />
                <div className="block-info">
                    <div className="footer-content">
                        <div className="service">
                            {edit ? (
                                <Space align="baseline">{valueFooter?.services?.value}</Space>
                            ) : (
                                <Input
                                    placeholder={gettext("Name company")}
                                    disabled={edit}
                                    type="text"
                                    value={valueFooter?.services?.value}
                                    allowClear
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
                        {valueFooter?.services?.list && getEntries(valueFooter.services.list).map((item) => {
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
                                                allowClear
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
                                                allowClear
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
                                    <Space align="baseline">{valueFooter?.address?.value}</Space>
                                ) : (
                                    <Input
                                        placeholder={gettext("Full address")}
                                        disabled={edit}
                                        type="text"
                                        value={valueFooter?.address?.value}
                                        allowClear
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
                                {valueFooter?.services?.list && getEntries(valueFooter.address.phone).map((item) => {
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
                                                        allowClear
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
                                                        allowClear
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
            <div className="uriit-footer-name">
                {edit ? (
                    <Space.Compact block>© {valueFooter?.footer_name?.base_year}-{new Date().getFullYear()} {valueFooter?.footer_name?.name}</Space.Compact>
                ) : (
                    <Space.Compact style={{ width: "100%" }}>
                        <Input
                            style={{ width: "20%" }}
                            placeholder={gettext("Footer base year")}
                            disabled={edit}
                            type="text"
                            value={valueFooter?.footer_name?.base_year}
                            allowClear
                            onChange={(e) => {
                                setValueFooter((prev) => ({
                                    ...prev,
                                    footer_name: {
                                        ...prev.footer_name,
                                        base_year: e.target.value,
                                    },
                                }));
                            }}
                        />
                        <Input
                            style={{ width: "80%" }}
                            placeholder={gettext("Footer name")}
                            disabled={edit}
                            type="text"
                            value={valueFooter?.footer_name?.name}
                            allowClear
                            onChange={(e) => {
                                setValueFooter((prev) => ({
                                    ...prev,
                                    footer_name: {
                                        ...prev.footer_name,
                                        name: e.target.value,
                                    },
                                }));
                            }}
                        />
                    </Space.Compact>
                )}
            </div>
        </div>
    );
})