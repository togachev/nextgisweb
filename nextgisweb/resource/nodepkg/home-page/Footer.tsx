import { useState } from "react";
import { Col, Row, Button, ColorPicker, Divider, Input, message, Space, Tooltip, Upload } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import ChevronRight from "@nextgisweb/icon/mdi/chevron-right";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { HomeStore } from "./HomeStore";

import type { GetProp, UploadProps } from "@nextgisweb/gui/antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

import "./Footer.less";

const LogoUriitComp = ({ store, disable }) => {
    const {
        valueFooter,
    } = store;

    const colorsFooter = ["#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF00", "#00FF80", "#00FFFF", "#0080FF", "#0000FF", "#8000FF", "#FF00FF", "#FF0080", "#FFFFFF", "#000000", "#106A90"];

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
                    const value = {
                        ...valueFooter,
                        logo: {
                            ...valueFooter.logo,
                            value: [{
                                url: url,
                                name: file.name,
                                value: file.uid,
                            }],
                        },
                    };
                    store.setValueFooter(value);
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
            const value = {
                ...valueFooter,
                logo: {
                    ...valueFooter.logo,
                    value: fileList,
                },
            };
            store.setValueFooter(value);
        },
        showUploadList: false,
        defaultFileList: valueFooter?.logo?.value,
        multiple: false,
        beforeUpload: (file, info) => {
            const fileName = file.name;
            const extension = fileName.slice(fileName.lastIndexOf("."));

            const isValidType = TYPE_FILE.some((e) => e.extension === extension);
            if (!isValidType) {
                message.error("Only SVG format is supported");
            }
            const isMaxCount = info.length <= 1;

            const isLimitVolume = file.size / 1024 < 2;
            if (!isLimitVolume) {
                message.error("Exceeding the volume of 2kb");
            }
            return (isValidType && isMaxCount && isLimitVolume) || Upload.LIST_IGNORE;
        },
        maxCount: 1,
        listType: "text",
        name: "file",
        onRemove: (file) => {
            const value = {
                ...valueFooter,
                logo: {
                    ...valueFooter.logo,
                    value: valueFooter.logo.value.filter((item) => item.uid !== file.uid),
                },
            };
            store.setValueFooter(value);
        }
    };

    const onChangeColorBackground = (c) => {
        const value = {
            ...valueFooter,
            logo: {
                ...valueFooter.logo,
                colorBackground: c.toHexString(),
            },
        };
        store.setValueFooter(value);
    }

    const onChangeColorText = (c) => {
        const value = {
            ...valueFooter,
            logo: {
                ...valueFooter.logo,
                colorText: c.toHexString(),
            },
        };
        store.setValueFooter(value);
    }

    const msgInfo = [
        gettext("Supported file format SVG."),
        gettext("Maximum file size 2KB."),
    ];

    return (
        <span className="logo-block">
            {!disable ?
                (<span className="edit-logo">
                    <span className="upload-content">
                        <span className="upload-block">
                            <Upload {...props} accept=".svg">
                                <Tooltip
                                    title={msgInfo.join(" ")}
                                    trigger={["click", "hover"]}
                                >
                                    <Button
                                        className="icon-button"
                                        title={gettext("Select File")}
                                    >{gettext("Select File")}</Button>
                                </Tooltip>
                            </Upload>
                            {valueFooter?.logo?.value?.length === 1 &&
                                valueFooter.logo.value.map((file, index) => (
                                    <span key={index}>
                                        <Button
                                            title={gettext("Remove file") + " - " + file.name}
                                            onClick={() => {
                                                const value = {
                                                    ...valueFooter,
                                                    logo: {
                                                        ...valueFooter.logo,
                                                        value: valueFooter.logo.value.filter((item) => item.uid !== file.uid),
                                                    },
                                                };
                                                store.setValueFooter(value);
                                            }}
                                            icon={<span className="icon-edit">
                                                <DeleteOffOutline />
                                            </span>}
                                        />
                                    </span>
                                ))}
                        </span>
                        {valueFooter?.logo?.value?.length === 1 &&
                            <span className="logo-icon-view">
                                <img className="uriit-logo-mini" src={valueFooter?.logo?.value[0].url} />
                            </span>
                        }
                    </span>
                    <span className="color-block" >
                        <ColorPicker
                            presets={[
                                {
                                    label: gettext("Default color"),
                                    colors: ["#212529"],
                                },
                                {
                                    label: gettext("Primary colors"),
                                    colors: colorsFooter,
                                },
                            ]}
                            allowClear value={valueFooter?.logo?.colorBackground} onChange={onChangeColorBackground} />
                        <span>{gettext("Color background")}</span>
                        <ColorPicker
                            presets={[
                                {
                                    label: gettext("Default color text"),
                                    colors: ["#fff"],
                                },
                                {
                                    label: gettext("Primary colors"),
                                    colors: colorsFooter,
                                },
                            ]}
                            allowClear value={valueFooter?.logo?.colorText} onChange={onChangeColorText} />
                        <span>{gettext("Color text")}</span>
                    </span>
                </span>) :
                valueFooter?.logo?.value?.length > 0 && (
                    <span className="uriit-logo">
                        <img src={valueFooter.logo.value[0].url} />
                    </span>
                )
            }
        </span>
    );
};

export const Footer = observer(({ store: storeProp, config }) => {
    const [disable, setDisable] = useState(true);

    const [store] = useState(
        () => storeProp || new HomeStore()
    );
    const {
        valueFooter,
    } = store;

    return (
        <div className="footer-home-page" style={{ backgroundColor: valueFooter?.logo?.colorBackground, color: valueFooter?.logo?.colorText, fontWeight: 500 }}>
            <div className="control-button">
                {config.isAdministrator === true && (
                    <Button
                        className={disable ? "icon-pensil" : "icon-edit-control"}
                        shape="square"
                        title={disable ? gettext("Edit") : gettext("Save changes")}
                        type="default"
                        icon={disable ? <Edit /> : <Save />}
                        onClick={() => {
                            setDisable(!disable);
                            store.setEditFooter(!store.editFooter);
                            store.saveSetting(valueFooter, "home_page_footer")
                        }}
                    />)}
                {!disable && (
                    <Button
                        className="icon-edit-control"
                        shape="square"
                        title={gettext("Add urls")}
                        type="default"
                        onClick={() => {
                            const value = {
                                ...valueFooter,
                                services: {
                                    ...valueFooter.services,
                                    list: {
                                        ...valueFooter.services.list,
                                        [String(Object.keys(valueFooter.services.list).length + 1)]: {
                                            ...valueFooter.services.list[
                                            String(Object.keys(valueFooter.services.list).length + 1)
                                            ],
                                            name: "",
                                            value: "",
                                        },
                                    },
                                },
                            };
                            store.setValueFooter(value);
                        }}
                        icon={<LinkEdit />}
                    />
                )}
                {!disable && (
                    <Button
                        className="icon-edit-control"
                        shape="square"
                        title={gettext("Add contacts")}
                        type="default"
                        onClick={() => {
                            const value = {
                                ...valueFooter,
                                address: {
                                    ...valueFooter.address,
                                    phone: {
                                        ...valueFooter.address.phone,
                                        [String(Object.keys(valueFooter.address.phone).length + 1)]: {
                                            ...valueFooter.address.phone[
                                            String(Object.keys(valueFooter.address.phone).length + 1)
                                            ],
                                            name: "",
                                            value: "",
                                        },
                                    },
                                },
                            };
                            store.setValueFooter(value);
                        }}
                        icon={<CardAccountPhone />}
                    />
                )}
            </div>
            <Row className={disable ? "footer-info" : "footer-info-edit"}>
                <Col className={disable ? "logo-col" : "logo-col-edit"} flex={disable && 1}>
                    <LogoUriitComp store={store} disable={disable} />
                </Col>
                <Col flex={4} className={disable ? "" : "footer-content-edit"}>
                    <span className="block-info">
                        {disable ?
                            (<span className="name-center">{valueFooter?.services?.value}</span>) :
                            (
                                <span className="item-edit">
                                    <Input
                                        placeholder={gettext("Name company")}
                                        disabled={disable}
                                        type="text"
                                        value={valueFooter?.services?.value}
                                        allowClear
                                        onChange={(e) => {
                                            const value = {
                                                ...valueFooter,
                                                services: {
                                                    ...valueFooter.services,
                                                    value: e.target.value,
                                                },
                                            };
                                            store.setValueFooter(value);
                                        }}
                                    />
                                </span>
                            )
                        }
                        {valueFooter?.services?.list && getEntries(valueFooter.services.list).map((item) => {
                            return (
                                <span key={item[0]} className={disable ? "services-list" : "item-edit"}>
                                    {disable ? (
                                        <span className="services-url">
                                            <a href={item[1]?.value} target="_blank" style={{ color: valueFooter?.logo?.colorText }}>
                                                <span className="icon-link">
                                                    <ChevronRight />
                                                </span>
                                                {item[1]?.name}
                                            </a>
                                        </span>
                                    ) : (<>
                                        <Input
                                            placeholder={gettext("Name url")}
                                            type="text"
                                            value={item[1]?.name}
                                            allowClear
                                            disabled={disable}
                                            onChange={(e) => {
                                                const value = {
                                                    ...valueFooter,
                                                    services: {
                                                        ...valueFooter.services,
                                                        list: {
                                                            ...valueFooter.services.list,
                                                            [item[0]]: {
                                                                ...valueFooter.services.list[item[0]],
                                                                name: e.target.value,
                                                            },
                                                        },
                                                    },
                                                };
                                                store.setValueFooter(value);
                                            }}
                                        />
                                        <Input
                                            className="first-input"
                                            placeholder={gettext("Url")}
                                            type="text"
                                            value={item[1]?.value}
                                            allowClear
                                            disabled={disable}
                                            onChange={(e) => {
                                                const value = {
                                                    ...valueFooter,
                                                    services: {
                                                        ...valueFooter.services,
                                                        list: {
                                                            ...valueFooter.services.list,
                                                            [item[0]]: {
                                                                ...valueFooter.services.list[item[0]],
                                                                value: e.target.value,
                                                            },
                                                        },
                                                    },
                                                };
                                                store.setValueFooter(value);
                                            }}
                                        />
                                        <Button
                                            title={gettext("Delete urls")}
                                            onClick={() => {
                                                const value = { ...valueFooter };
                                                delete value.services.list[item[0]];
                                                store.setValueFooter(value);
                                            }}
                                            className="icon-edit"
                                            icon={<DeleteOffOutline />}
                                        />
                                    </>)}
                                </span>
                            )
                        })}
                        {disable && (<Divider />)}
                        <span className="address-content">
                            <span className={disable ? "address" : "item-edit"}>
                                {disable ? (
                                    <span>{valueFooter?.address?.value}</span>
                                ) : (
                                    <Input
                                        placeholder={gettext("Full address")}
                                        disabled={disable}
                                        type="text"
                                        value={valueFooter?.address?.value}
                                        allowClear
                                        onChange={(e) => {
                                            const value = {
                                                ...valueFooter,
                                                address: {
                                                    ...valueFooter.address,
                                                    value: e.target.value,
                                                },
                                            };
                                            store.setValueFooter(value);
                                        }}
                                    />
                                )}
                            </span>
                            <span className="phone">
                                {valueFooter?.services?.list && getEntries(valueFooter.address.phone).map((item) => {
                                    if (disable) {
                                        return (
                                            <Space key={item[0]} className="phone-item">
                                                <span className="name">{item[1]?.name}</span>
                                                <span className="value">{item[1]?.value}</span>
                                            </Space>
                                        )
                                    } else {
                                        return (
                                            <span key={item[0]} className="item-edit">
                                                <Input
                                                    placeholder={gettext("Name")}
                                                    type="text"
                                                    value={item[1]?.name}
                                                    allowClear
                                                    disabled={disable}
                                                    onChange={(e) => {
                                                        const value = {
                                                            ...valueFooter,
                                                            address: {
                                                                ...valueFooter.address,
                                                                phone: {
                                                                    ...valueFooter.address.phone,
                                                                    [item[0]]: {
                                                                        ...valueFooter.address.phone[item[0]],
                                                                        name: e.target.value,
                                                                    },
                                                                },
                                                            },
                                                        };
                                                        store.setValueFooter(value);
                                                    }}
                                                />
                                                <Input
                                                    className="first-input"
                                                    placeholder={gettext("Value")}
                                                    type="text"
                                                    value={item[1]?.value}
                                                    allowClear
                                                    disabled={disable}
                                                    onChange={(e) => {
                                                        const value = {
                                                            ...valueFooter,
                                                            address: {
                                                                ...valueFooter.address,
                                                                phone: {
                                                                    ...valueFooter.address.phone,
                                                                    [item[0]]: {
                                                                        ...valueFooter.address.phone[item[0]],
                                                                        value: e.target.value,
                                                                    },
                                                                },
                                                            },
                                                        };
                                                        store.setValueFooter(value);
                                                    }}
                                                />
                                                <Button
                                                    title={gettext("Delete contact")}
                                                    onClick={() => {
                                                        const value = { ...valueFooter };
                                                        delete value.address.phone[item[0]];
                                                        store.setValueFooter(value);
                                                    }}
                                                    className="icon-edit"
                                                    icon={<DeleteOffOutline />}
                                                />
                                            </span>
                                        )
                                    }
                                })}
                            </span>
                        </span>
                        {!disable && (
                            <Row className="item-edit">
                                <Col flex="96px">
                                    <Input
                                        placeholder={gettext("Footer base year")}
                                        disabled={disable}
                                        type="text"
                                        value={valueFooter?.footer_name?.base_year}
                                        allowClear
                                        onChange={(e) => {
                                            const value = {
                                                ...valueFooter,
                                                footer_name: {
                                                    ...valueFooter.footer_name,
                                                    base_year: e.target.value,
                                                },
                                            };
                                            store.setValueFooter(value);
                                        }}
                                    />
                                </Col>
                                <Col flex="auto" className="first-input">
                                    <Input
                                        placeholder={gettext("Name footer page")}
                                        disabled={disable}
                                        type="text"
                                        value={valueFooter?.footer_name?.name}
                                        allowClear
                                        onChange={(e) => {
                                            const value = {
                                                ...valueFooter,
                                                footer_name: {
                                                    ...valueFooter.footer_name,
                                                    name: e.target.value,
                                                },
                                            };
                                            store.setValueFooter(value);
                                        }}
                                    />
                                </Col>
                            </Row>
                        )}
                    </span>
                </Col>
            </Row>
            <Row>
                <Col>
                    {disable && (
                        <div className="uriit-footer-name">
                            © {valueFooter?.footer_name?.base_year}-{new Date().getFullYear()} {valueFooter?.footer_name?.name}
                        </div>
                    )}
                </Col>
            </Row>
        </div >
    );
})