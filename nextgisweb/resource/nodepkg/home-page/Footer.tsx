import { useState } from "react";
import { Col, ColorPicker, Row, Button, Form, Divider, Input, message, Space, Tooltip, Upload } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import ChevronRight from "@nextgisweb/icon/mdi/chevron-right";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { HomeStore } from "./HomeStore";

import type { UploadProps } from "@nextgisweb/gui/antd";

import "./Footer.less";

const LogoUriitComp = ({ store }) => {

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

    const props: UploadProps = {
        defaultFileList: store.valueFooter?.logo?.file?.status === "done" && [store.valueFooter?.logo?.file],
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
        itemRender: (originNode, file) => {
            console.log(originNode, file, file.thumbUrl);
            const children = originNode.props.children.filter(item => ["view", "download-delete"].includes(item.key))
            return (
                <Space>
                    <span className="custom-image">
                        <img src={file.thumbUrl} />
                    </span>
                    {children.map(item => (
                        <span key={item.key}>{item}</span>
                    ))}
                </Space>
            )
        },
        maxCount: 1,
    };

    const msgInfo = [
        gettext("Supported file format SVG."),
        gettext("Maximum file size 2KB."),
    ];

    const normalizingFileUpload = (event) => {
        if (Array.isArray(event)) {
            return;
        }
        return event && event.file;
    };

    return (
        <span className="logo-block">
            <span className="edit-logo">
                <Row gutter={[5, 5]} className="item-edit">
                    <Col flex="auto">
                        <span className="upload-block">
                            <Form.Item
                                noStyle
                                name={["logo", "file"]}
                                valuePropName="file"
                                getValueFromEvent={normalizingFileUpload}
                            >
                                <Upload {...props} name="logo" listType="picture" accept=".svg">
                                    <Tooltip
                                        title={msgInfo.join(" ")}
                                        trigger={["click", "hover"]}
                                        style={{ lineHeight: 2 }}
                                    >
                                        <Button
                                            className="upload-button"
                                            title={gettext("Select File")}
                                            type="link" size="small"
                                        >{gettext("Select File")}</Button>
                                    </Tooltip>
                                </Upload>
                            </Form.Item>
                        </span>
                    </Col>
                </Row>
                <Row gutter={[5, 5]} className="item-edit">
                    <Col flex="auto">{gettext("Color background")}</Col>
                    <Col>
                        <Form.Item
                            noStyle
                            name={["logo", "colorBackground"]}
                            getValueFromEvent={(color) => {
                                return "#" + color.toHex();
                            }}
                        >
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
                                allowClear value={store.valueFooter?.logo?.colorText}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[5, 5]} className="item-edit">
                    <Col flex="auto">{gettext("Color text")}</Col>
                    <Col>
                        <Form.Item
                            noStyle
                            name={["logo", "colorText"]}
                            getValueFromEvent={(color) => {
                                return "#" + color.toHex();
                            }}
                        >
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
                                allowClear value={store.valueFooter?.logo?.colorText} />
                        </Form.Item>
                    </Col>
                </Row>
            </span>
        </span>
    );
};

export const Footer = observer(({ store: storeProp, config }) => {
    const [disable, setDisable] = useState(true);
    const [store] = useState(
        () => storeProp || new HomeStore()
    );

    const onFinish = (value) => {
        setDisable(!disable);
        store.setValueFooter(value);
        store.saveSetting(value, "home_page_footer");
    }
    return (
        <div className="footer-home-page" style={{ backgroundColor: store.valueFooter?.logo?.colorBackground, color: store.valueFooter?.logo?.colorText, fontWeight: 500 }}>
            <div className="control-button">
                {config.isAdministrator === true && disable && (
                    <Button
                        className="icon-pensil"
                        shape="square"
                        title={gettext("Edit")}
                        type="default"
                        icon={<Edit />}
                        onClick={() => {
                            setDisable(!disable);
                        }}
                    />)}
            </div>
            {disable ? (<>
                <Row className="footer-info">
                    {store.valueFooter?.logo?.file?.status === "done" && <Col className="logo-col" flex={1}>
                        <span className="uriit-logo">
                            <img src={store.valueFooter?.logo?.file?.thumbUrl} />
                        </span>
                    </Col>}
                    <Col flex={4} >
                        <span className="block-info">
                            <span className="name-center">{store.valueFooter?.services?.value}</span>
                            {store.valueFooter?.services?.list.map((item, index) => {
                                return (
                                    <span key={index} className="services-list">
                                        <span className="services-url">
                                            <a href={item?.value} target="_blank" style={{ color: store.valueFooter?.logo?.colorText }}>
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
                                    <span>{store.valueFooter?.address?.value}</span>
                                </span>
                                <span className="phone">
                                    {store.valueFooter?.address?.phone.map((item, index) => {
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
                            © {store.valueFooter?.footer_name?.base_year}-{new Date().getFullYear()} {store.valueFooter?.footer_name?.name}
                        </div>
                    </Col>
                </Row>
            </>) : (
                <Form
                    name="dynamic_form_complex"
                    autoComplete="off"
                    initialValues={store.valueFooter}
                    onFinish={onFinish}
                >
                    <Row className="footer-info-edit form-footer">
                        <Col flex="auto">
                            <Row gutter={[5, 5]}>
                                <Col flex="auto">
                                    <LogoUriitComp store={store} />
                                </Col>
                                <Col flex={6}>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Row gutter={[5, 5]} className="item-edit">
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
                                                                <Row gutter={[5, 5]} justify="end">
                                                                    <Col>
                                                                        <Button
                                                                            className="item-edit"
                                                                            onClick={() => add()}
                                                                            icon={<LinkEdit />}
                                                                            title={gettext("Add url menu")}
                                                                            type="link" size="small"
                                                                        >
                                                                            {gettext("Add url menu")}
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                                {fields.map((field, index) => (
                                                                    <Row key={index} gutter={[5, 5]} wrap={false} className="item-edit">
                                                                        <Col flex="auto">
                                                                            <Form.Item noStyle name={[field.name, "name"]}>
                                                                                <Input type="text"
                                                                                    allowClear
                                                                                    placeholder={gettext("Name url")} />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="auto">
                                                                            <Form.Item noStyle name={[field.name, "value"]}>
                                                                                <Input type="text"
                                                                                    allowClear
                                                                                    placeholder={gettext("Url")} />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="none">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    remove(field.name);
                                                                                }}
                                                                                icon={<DeleteOffOutline />}
                                                                                type="link" size="small"
                                                                                title={gettext("Remove url menu")}
                                                                            />
                                                                        </Col>
                                                                    </Row>
                                                                ))}
                                                            </>
                                                        )}
                                                    </Form.List>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                    <Row gutter={[5, 5]}>
                                        <Col flex="auto">
                                            <Row gutter={[5, 5]} className="item-edit">
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
                                                                <Row gutter={[5, 5]} justify="end">
                                                                    <Col>
                                                                        <Button

                                                                            className="item-edit"
                                                                            onClick={() => add()}
                                                                            icon={<LinkEdit />}
                                                                            title={gettext("Add contact")}
                                                                            type="link" size="small"
                                                                        >
                                                                            {gettext("Add contact")}
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                                {fields.map((field, index) => (
                                                                    <Row key={index} gutter={[5, 5]} wrap={false} className="item-edit">
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
                                                                                type="link" size="small"
                                                                                title={gettext("Remove contact")}
                                                                            />
                                                                        </Col>
                                                                    </Row>
                                                                ))}

                                                            </>
                                                        )}
                                                    </Form.List>
                                                </Col>
                                            </Row>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                            <Row gutter={[5, 5]} className="item-edit">
                                <Col flex="72px">
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
                            <Row gutter={[5, 5]} justify="end">
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        {!disable && (
                                            <Button
                                                title={gettext("Cancel")}
                                                type="link" size="small"
                                                icon={<Cancel />}
                                                onClick={() => {
                                                    setDisable(!disable);
                                                }}
                                            >
                                                {gettext("Cancel")}
                                            </Button>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        <Button
                                            type="link" size="small"
                                            htmlType="submit"
                                            icon={<Save />}
                                            title={gettext("Save")}
                                        >
                                            {gettext("Save")}
                                        </Button>
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