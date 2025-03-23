import { useState } from "react";
import { Col, ColorPicker, Row, Button, Form, Divider, Input, message, Space, Tooltip, Upload } from "@nextgisweb/gui/antd";
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

const LogoUriitComp = ({ store }) => {
    const {
        editFooter,
        valueFooter,
        setValueFooter,
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
        setValueFooter((prev) => ({
            ...prev,
            logo: {
                ...prev.logo,
                colorBackground: c.toHexString(),
            },
        }));
    }

    const onChangeColorText = (c) => {
        setValueFooter((prev) => ({
            ...prev,
            logo: {
                ...prev.logo,
                colorText: c.toHexString(),
            },
        }));
    }

    const msgInfo = [
        gettext("Supported file format SVG."),
        gettext("Maximum file size 2KB."),
    ];

    return (
        <span className="logo-block">
            <span className="edit-logo">
                <Row gutter={[5, 5]}>
                    <Col flex="auto">
                        <span className="upload-block">
                            <Form.Item noStyle valuePropName="fileList" getValueFromEvent={valueFooter?.logo?.value[0]}>
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
                            </Form.Item>
                            <Form.Item noStyle>
                                {valueFooter.logo.value.length > 0 && (
                                    <Button
                                        title={gettext("Remove file") + " - " + valueFooter?.logo?.value?.name}
                                        onClick={() => {
                                            setValueFooter((prev) => ({
                                                ...prev,
                                                logo: {
                                                    ...prev.logo,
                                                    value: prev.logo.value.filter((item) => item.uid !== valueFooter?.logo?.value?.uid),
                                                },
                                            }));
                                        }}
                                        icon={<span className="icon-edit">
                                            <DeleteOffOutline />
                                        </span>}
                                    />
                                )}
                            </Form.Item>
                        </span>
                        {valueFooter?.logo?.value?.length === 1 &&
                            <span className="logo-icon-view">
                                <img className="uriit-logo-mini" src={valueFooter?.logo?.value[0].url} />
                            </span>
                        }
                    </Col>
                </Row>
                <Row gutter={[5, 5]}>
                    <Col flex="auto">
                        <Form.Item noStyle label={gettext("Color background")} name={["logo", "colorBackground"]}>
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
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[5, 5]}>
                    <Col flex="auto">
                        <Form.Item noStyle label={gettext("Color text")} name={["logo", "colorText"]}>
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
                        </Form.Item>
                    </Col>
                </Row>
            </span>
        </span>
    );
};

export const Footer = observer(({ store: storeProp, config }) => {
    const [disable, setDisable] = useState(true);
    const [form] = Form.useForm();
    const [store] = useState(
        () => storeProp || new HomeStore()
    );
    const {
        valueFooter,
    } = store;

    const initialValues = {
        services: {
            services_value: "",
            list: [{}],
        },
        address: {
            address_value: "",
            phone: [{}],
        },
        logo: {
            value: {
                url: "",
                name: "",
                value: "",
            },
            colorText: "",
            colorBackground: "",
        },
        footer_name: {
            name: "",
            base_year: "",
        },
    }

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
            </div>
            {disable ? (<>
                <Row className="footer-info">
                    <Col className="logo-col" flex={1}>
                        <span className="logo-block">
                            <span className="uriit-logo">
                                <img src={valueFooter?.logo?.value[0]?.url} />
                            </span>
                        </span>
                    </Col>
                    <Col flex={4} >
                        <span className="block-info">
                            <span className="name-center">{valueFooter?.services?.value}</span>
                            {valueFooter?.services?.list.map((item, index) => {
                                return (
                                    <span key={index} className="services-list">
                                        <span className="services-url">
                                            <a href={item?.value} target="_blank" style={{ color: valueFooter?.logo?.colorText }}>
                                                <span className="icon-link">
                                                    <ChevronRight />
                                                </span>
                                                {item?.name}
                                            </a>
                                        </span>
                                    </span>
                                )
                            })}
                            <Divider />
                            <span className="address-content">
                                <span className="address">
                                    <span>{valueFooter?.address?.value}</span>
                                </span>
                                <span className="phone">
                                    {valueFooter?.address?.phone.map((item, index) => {
                                        return (
                                            <Space key={index} className="phone-item">
                                                <span className="name">{item?.name}</span>
                                                <span className="value">{item?.value}</span>
                                            </Space>
                                        )
                                    })}
                                </span>
                            </span>
                        </span>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <div className="uriit-footer-name">
                            © {valueFooter?.footer_name?.base_year}-{new Date().getFullYear()} {valueFooter?.footer_name?.name}
                        </div>
                    </Col>
                </Row>
            </>) : (
                <Form
                    form={form}
                    name="dynamic_form_complex"
                    autoComplete="off"
                    initialValues={valueFooter}
                >
                    <Row gutter={[5, 5]} className="footer-info-edit">
                        <Col flex="auto">
                            <Row gutter={[5, 5]}>
                                <Col flex="auto">
                                    <LogoUriitComp store={store} />
                                    {/* <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Form.Item noStyle name={["logo", "value", "url"]}>
                                                <Input placeholder="name" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Form.Item noStyle name={["logo", "value", "name"]}>
                                                <Input placeholder="name" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Form.Item noStyle name={["logo", "value", "value"]}>
                                                <Input placeholder="name" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Form.Item noStyle name={["logo", "colorText"]}>
                                                <Input placeholder="name" />
                                            </Form.Item>
                                        </Col>
                                    </Row>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Form.Item noStyle name={["logo", "colorBackground"]}>
                                                <Input placeholder="name" />
                                            </Form.Item>
                                        </Col>
                                    </Row> */}
                                </Col>
                                <Col flex={6}>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Row gutter={[5, 5]}>
                                                <Col flex="auto">
                                                    <Form.Item noStyle name={["services", "value"]}>
                                                        <Input placeholder="name" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={[5, 5]}>
                                                <Col flex="auto">
                                                    <Form.List name={["services", "list"]}>
                                                        {(fields, { add, remove }) => (
                                                            <>
                                                                <Row gutter={[5, 5]}>
                                                                    <Col flex="none">
                                                                        <Button onClick={() => add()} icon={<LinkEdit />} />
                                                                    </Col>
                                                                    <Col flex="auto">
                                                                        {fields.map((field, index) => (
                                                                            <Row key={index} gutter={[5, 5]} wrap={false}>
                                                                                <Col flex="auto">
                                                                                    <Form.Item noStyle name={[field.name, "name"]}>
                                                                                        <Input />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col flex="auto">
                                                                                    <Form.Item noStyle name={[field.name, "value"]}>
                                                                                        <Input />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col flex="none">
                                                                                    <Button
                                                                                        onClick={() => {
                                                                                            remove(field.name);
                                                                                        }}
                                                                                        icon={<DeleteOffOutline />}
                                                                                    />
                                                                                </Col>
                                                                            </Row>
                                                                        ))}
                                                                    </Col>
                                                                </Row>
                                                            </>
                                                        )}
                                                    </Form.List>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Row gutter={[5, 5]}>
                                                <Col flex="auto">
                                                    <Form.Item noStyle name={["address", "value"]}>
                                                        <Input placeholder="value" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={[5, 5]}>
                                                <Col flex="auto">
                                                    <Form.List name={["address", "phone"]}>
                                                        {(fields, { add, remove }) => (
                                                            <>
                                                                <Row gutter={[5, 5]}>
                                                                    <Col flex="none">
                                                                        <Button onClick={() => add()} icon={<LinkEdit />} />
                                                                    </Col>
                                                                    <Col flex="auto">
                                                                        {fields.map((field, index) => (
                                                                            <Row key={index} gutter={[5, 5]} wrap={false}>
                                                                                <Col flex="auto">
                                                                                    <Form.Item noStyle name={[field.name, "name"]}>
                                                                                        <Input />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col flex="auto">
                                                                                    <Form.Item noStyle name={[field.name, "value"]}>
                                                                                        <Input />
                                                                                    </Form.Item>
                                                                                </Col>
                                                                                <Col flex="none">
                                                                                    <Button
                                                                                        onClick={() => {
                                                                                            remove(field.name);
                                                                                        }}
                                                                                        icon={<DeleteOffOutline />}
                                                                                    />
                                                                                </Col>
                                                                            </Row>
                                                                        ))}
                                                                    </Col>
                                                                </Row>
                                                            </>
                                                        )}
                                                    </Form.List>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <Row gutter={[5, 5]}>
                                <Col flex="auto">
                                    <Form.Item noStyle name={["footer_name", "base_year"]}>
                                        <Input placeholder="base_year" />
                                    </Form.Item>
                                </Col>
                                <Col flex="auto">
                                    <Form.Item noStyle name={["footer_name", "name"]}>
                                        <Input placeholder="name" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                </Form>
            )}
        </div >
    );
})