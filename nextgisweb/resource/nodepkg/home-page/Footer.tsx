import { Col, Row, Button, ColorPicker, Divider, Input, message, Space, Tooltip, Upload } from "@nextgisweb/gui/antd";
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

import type { GetProp, UploadProps } from "@nextgisweb/gui/antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

import "./Footer.less";

const LogoUriitComp = ({ store }) => {
    const {
        editFooter,
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
            setValueFooter((prev) => ({
                ...prev,
                logo: {
                    ...prev.logo,
                    value: prev.logo.value.filter((item) => item.uid !== file.uid),
                },
            }));
        }
    };

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

    const msgInfo = [
        gettext("Supported file format SVG."),
        gettext("Maximum file size 2KB."),
    ];

    return (
        <span className="logo-block">
            {!editFooter ?
                (<span className="edit-logo">
                    <span className="upload-content">
                        <span className="upload-block">
                            <Upload {...props} accept=".svg">
                                <Tooltip
                                    title={msgInfo.join(" ")}
                                    trigger={["click", "hover"]}
                                >
                                    <Button
                                        size="small"
                                        className="icon-button"
                                        title={gettext("Select File")}
                                    >{gettext("Select File")}</Button>
                                </Tooltip>
                            </Upload>
                            {valueFooter?.logo?.value?.length === 1 &&
                                valueFooter.logo.value.map((file, index) => (
                                    <span key={index}>
                                        <Button
                                            size="small"
                                            title={gettext("Remove file") + " - " + file.name}
                                            onClick={() => {
                                                setValueFooter((prev) => ({
                                                    ...prev,
                                                    logo: {
                                                        ...prev.logo,
                                                        value: prev.logo.value.filter((item) => item.uid !== file.uid),
                                                    },
                                                }));
                                            }}
                                            className="icon-button"
                                            icon={<DeleteOffOutline />}
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
                                    colors: ["#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF00", "#00FF80", "#00FFFF", "#0080FF", "#0000FF", "#8000FF", "#FF00FF", "#FF0080", "#FFFFFF", "#000000", "#106A90"],
                                },
                            ]}
                            allowClear value={valueFooter?.logo?.colorBackground} onChange={onChangeColorBackground} />
                        <span>Color background</span>
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

export const Footer = observer(({ store, config }) => {
    const {
        editFooter,
        setEditFooter,
        valueFooter,
        setValueFooter,
    } = store;

    const save = async () => {
        const payload = Object.fromEntries(
            Object.entries(valueFooter || {}).filter(([, v]) => v)
        );

        await route("pyramid.csettings").put({
            json: { pyramid: { home_page_footer: payload } },
        });
    };

    return (
        <div className="footer-home-page" style={{ backgroundColor: valueFooter?.logo?.colorBackground }}>
            <div className="control-button">
                {config.isAdministrator === true && (<Button
                    className={editFooter ? "icon-pensil" : "icon-edit"}
                    shape="square"
                    title={editFooter ? gettext("Edit footer") : gettext("Save footer")}
                    type="default"
                    icon={editFooter ? <Edit /> : <Save />}
                    onClick={() => {
                        setEditFooter(!editFooter);
                        save()
                    }}
                />)}
                {!editFooter && (
                    <Button
                        className="icon-edit"
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
                {!editFooter && (
                    <Button
                        className="icon-edit"
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
            <Row className={editFooter ? "footer-info" : "footer-info-edit"}>
                <Col className="logo-col" flex={editFooter && 1}>
                    <LogoUriitComp store={store} />
                </Col>
                <Col flex={4} className={editFooter ? "" : "footer-content-edit"}>
                    <span className="block-info">
                        <span className="footer-content">
                            <span className="service">
                                {editFooter ?
                                    valueFooter?.services?.value
                                    : (
                                        <Input
                                            placeholder={gettext("Name company")}
                                            disabled={editFooter}
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
                            </span>
                            {valueFooter?.services?.list && getEntries(valueFooter.services.list).map((item) => {
                                return (
                                    <span key={item[0]} className="services-list">
                                        {editFooter ? (
                                            <span className="services-url">
                                                <a href={item[1]?.value} target="_blank">
                                                    <span className="icon-link">
                                                        <ChevronRight />
                                                    </span>
                                                    {item[1]?.name}
                                                </a>
                                            </span>
                                        ) : (
                                            <span className="item-edit">
                                                <Input
                                                    placeholder={gettext("Name url")}
                                                    type="text"
                                                    value={item[1]?.name}
                                                    allowClear
                                                    disabled={editFooter}
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
                                                    disabled={editFooter}
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
                                                <Button
                                                    title={gettext("Delete urls")}
                                                    onClick={() => {
                                                        const state = { ...valueFooter };
                                                        delete state.services.list[item[0]];
                                                        setValueFooter(state);
                                                    }}
                                                    className="icon-edit"
                                                    icon={<DeleteOffOutline />}
                                                />
                                            </span>
                                        )}
                                    </span>
                                )
                            })}
                            <Divider />
                            <span className={!editFooter ? "address-edit" : "address-content"}>
                                <span className="address">
                                    {editFooter ? (
                                        <span>{valueFooter?.address?.value}</span>
                                    ) : (
                                        <Input
                                            placeholder={gettext("Full address")}
                                            disabled={editFooter}
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
                                </span>
                                <span className="phone">
                                    {valueFooter?.services?.list && getEntries(valueFooter.address.phone).map((item) => {
                                        if (editFooter) {
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
                                                        placeholder={gettext("Name contacts")}
                                                        type="text"
                                                        value={item[1]?.name}
                                                        allowClear
                                                        disabled={editFooter}
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
                                                        disabled={editFooter}
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
                                                    <Button
                                                        title={gettext("Delete contacts")}
                                                        onClick={() => {
                                                            const state = { ...valueFooter };
                                                            delete state.address.phone[item[0]];
                                                            setValueFooter(state);
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
                            {!editFooter && (
                                <>
                                    <Input
                                        style={{ width: "20%" }}
                                        placeholder={gettext("Footer base year")}
                                        disabled={editFooter}
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
                                        disabled={editFooter}
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
                                </>
                            )}
                        </span>
                    </span>
                </Col>
            </Row>
            <Row>
                <Col>
                    <div className="uriit-footer-name">
                        {editFooter && (<>© {valueFooter?.footer_name?.base_year}-{new Date().getFullYear()} {valueFooter?.footer_name?.name}</>)}
                    </div>
                </Col>
            </Row>
        </div >
    );
})