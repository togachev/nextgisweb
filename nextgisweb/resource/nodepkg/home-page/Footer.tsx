import { useMemo, useState } from "react";
import { Col, ColorPicker, Row, Button, Form, Divider, Input, message, Space, Tooltip, Upload } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import FileArrowUpDownOutline from "@nextgisweb/icon/mdi/file-arrow-up-down-outline";
import Restore from "@nextgisweb/icon/mdi/restore";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { HomeStore } from "./HomeStore";
import type { GetProp, UploadProps } from "@nextgisweb/gui/antd";

type FileType = Parameters<GetProp<UploadProps, "beforeUpload">>[0];

import "./Footer.less";

const LogoUriitComp = observer(({ store }) => {

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

    const getBase64 = (file: FileType): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file as Blob);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const props: UploadProps = useMemo(() => ({
        defaultFileList: store.valueFooter?.logo?.file?.status === "done" && [store.valueFooter?.logo?.file],
        multiple: false,
        customRequest: async (options) => {
            const { onSuccess, onError, file } = options;
            try {
                if (!file.url && !file.preview) {
                    file.preview = await getBase64(file);
                    const value = {
                        ...store.valueFooter,
                        logo: {
                            ...store.valueFooter.logo,
                            file: file,
                        },
                    }
                    store.setValueFooter(value);
                }
                if (onSuccess) {
                    onSuccess("Ok");
                }
            } catch (err) {
                if (onError) {
                    onError(new Error("Exception download"));
                }
            }
        },
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
        showUploadList: {
            showDownloadIcon: false,
            showRemoveIcon: true,
            removeIcon: <DeleteOffOutline />,
        },
        itemRender: (originNode, file) => {
            return (
                <Space direction="horizontal">
                    <Tooltip
                        title={file.name + ", " + (file.size / 1024).toFixed(2) + "KB"}
                        trigger={["click", "hover"]}
                    >
                        <img className="custom-image" src={file.preview} />
                    </Tooltip >
                    {originNode.props.children.filter(item => ["download-delete"].includes(item.key))}
                </Space>
            )
        },
        maxCount: 1,
    }), [store]);

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
                <Row gutter={[16, 16]} className="item-edit">
                    <Col flex="auto">
                        <Form.Item
                            noStyle
                            name={["logo", "file"]}
                            valuePropName="file"
                            getValueFromEvent={normalizingFileUpload}
                        >
                            <Upload {...props} listType="picture" accept=".svg" className="upload-item">
                                <Tooltip
                                    title={msgInfo.join(" ")}
                                    trigger={["click", "hover"]}
                                >
                                    <Button
                                        icon={<FileArrowUpDownOutline />}
                                        type="default"
                                        title={gettext("Select File")}
                                    />
                                </Tooltip>
                            </Upload>
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} className="item-edit">
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
                <Row gutter={[16, 16]} className="item-edit">
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
});

export const Footer = observer(({ store: storeProp, config }) => {
    const [form] = Form.useForm();
    const [disable, setDisable] = useState(true);

    const [store] = useState(
        () => storeProp || new HomeStore()
    );

    const onFinish = (value) => {
        setDisable(!disable);
        store.setValueFooter(value);
        store.saveSetting(value, "home_page_footer");
    };

    const cancelForm = () => {
        setDisable(!disable);
        store.getValuesFooter();
    };

    const resetForm = () => {
        store.getValuesFooter();
        form.resetFields()
    };

    const applyForm = () => {
        store.setValueFooter(form.getFieldsValue());
    };

    const openForm = () => {
        setDisable(!disable);
    }

    return (
        <div className="footer-home-page" style={{ backgroundColor: store.valueFooter?.logo?.colorBackground, color: store.valueFooter?.logo?.colorText, fontWeight: 500 }}>
            <div className="control-button">
                {config.isAdministrator === true && disable && (
                    <Button
                        className="icon-pensil"
                        title={gettext("Edit")}
                        type="default"
                        icon={<Edit />}
                        onClick={openForm}
                    />)}
            </div>
            {!disable && (
                <Form
                    form={form}
                    name="ngw_home_page_footer"
                    autoComplete="off"
                    initialValues={store.initialFooter}
                    onFinish={onFinish}
                    clearOnDestroy={true}
                >
                    <Row className="footer-info-edit form-padding">
                        <Col flex="auto">
                            <Row gutter={[16, 16]}>
                                <Col flex="auto">
                                    <LogoUriitComp store={store} />
                                </Col>
                                <Col flex={6}>
                                    <Row gutter={[16, 16]}>
                                        <Col flex="auto">
                                            <Row gutter={[16, 16]} className="item-edit">
                                                <Col flex="auto">
                                                    <Form.Item noStyle name={["services", "value"]}>
                                                        <Input allowClear placeholder="name" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={[16, 16]}>
                                                <Col flex="auto">
                                                    <Form.List name={["services", "list"]}>
                                                        {(fields, { add, remove }) => (
                                                            <>
                                                                <Row gutter={[16, 16]} justify="end">
                                                                    <Col>
                                                                        <Button
                                                                            className="item-edit"
                                                                            onClick={() => add()}
                                                                            icon={<LinkEdit />}
                                                                            title={gettext("Add url menu")}
                                                                            type="default"
                                                                        >
                                                                            {gettext("Add url menu")}
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                                {fields.map((field, index) => (
                                                                    <Row key={index} gutter={[16, 16]} wrap={false} className="item-edit">
                                                                        <Col flex="auto">
                                                                            <Form.Item noStyle name={[field.name, "name"]}>
                                                                                <Input type="text" allowClear placeholder={gettext("Name url")} />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="auto">
                                                                            <Form.Item noStyle name={[field.name, "value"]}>
                                                                                <Input type="text" allowClear placeholder={gettext("Url")} />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="none">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    remove(field.name);
                                                                                }}
                                                                                icon={<DeleteOffOutline />}
                                                                                type="default"
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
                                    <Row gutter={[16, 16]}>
                                        <Col flex="auto">
                                            <Row gutter={[16, 16]} className="item-edit">
                                                <Col flex="auto">
                                                    <Form.Item noStyle name={["address", "value"]}>
                                                        <Input allowClear placeholder="value" />
                                                    </Form.Item>
                                                </Col>
                                            </Row>
                                            <Row gutter={[16, 16]}>
                                                <Col flex="auto">
                                                    <Form.List name={["address", "phone"]}>
                                                        {(fields, { add, remove }) => (
                                                            <>
                                                                <Row gutter={[16, 16]} justify="end">
                                                                    <Col>
                                                                        <Button
                                                                            className="item-edit"
                                                                            onClick={() => add()}
                                                                            icon={<CardAccountPhone />}
                                                                            title={gettext("Add contact")}
                                                                            type="default"
                                                                        >
                                                                            {gettext("Add contact")}
                                                                        </Button>
                                                                    </Col>
                                                                </Row>
                                                                {fields.map((field, index) => (
                                                                    <Row key={index} gutter={[16, 16]} wrap={false} className="item-edit">
                                                                        <Col flex="auto">
                                                                            <Form.Item noStyle name={[field.name, "name"]}>
                                                                                <Input allowClear />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="auto">
                                                                            <Form.Item noStyle name={[field.name, "value"]}>
                                                                                <Input allowClear />
                                                                            </Form.Item>
                                                                        </Col>
                                                                        <Col flex="none">
                                                                            <Button
                                                                                onClick={() => {
                                                                                    remove(field.name);
                                                                                }}
                                                                                icon={<DeleteOffOutline />}
                                                                                type="default"
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
                            <Row gutter={[16, 16]} className="item-edit">
                                <Col flex="96px">
                                    <Form.Item noStyle name={["footer_name", "base_year"]}>
                                        <Input allowClear placeholder="base_year" />
                                    </Form.Item>
                                </Col>
                                <Col flex="auto">
                                    <Form.Item noStyle name={["footer_name", "name"]}>
                                        <Input allowClear placeholder="name" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Row gutter={[16, 16]} justify="end">
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        {!disable && (
                                            <Button
                                                title={gettext("Cancel")}
                                                type="default"
                                                icon={<Cancel />}
                                                onClick={cancelForm}
                                            >
                                                {gettext("Cancel")}
                                            </Button>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        {!disable && (
                                            <Button
                                                title={gettext("Reset")}
                                                type="default"
                                                icon={<Restore />}
                                                onClick={resetForm}
                                            >
                                                {gettext("Reset")}
                                            </Button>
                                        )}
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        <Button
                                            type="default"
                                            onClick={applyForm}
                                            icon={<Save />}
                                            title={gettext("Apply")}
                                        >
                                            {gettext("Apply")}
                                        </Button>
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        <Button
                                            type="default"
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
            <Row className="footer-info">
                {store.valueFooter?.logo?.file?.status === "done" && (
                    <Col className="logo-col" flex={1}>
                        <span className="uriit-logo">
                            <img src={store.valueFooter?.logo?.file?.preview} />
                        </span>
                    </Col>
                )}
                <Col flex={4} >
                    <span className="block-info">
                        <Row className="name-center">
                            <Col className="address">{store.valueFooter?.services?.value}</Col>
                        </Row>
                        {store.valueFooter?.services?.list.map((item, index) => {
                            return (
                                <Row key={index} className="services-list">
                                    <Col className="services-url">
                                        <a href={item?.value} target="_blank" style={{ color: store.valueFooter?.logo?.colorText }}>
                                            {item?.name}
                                        </a>
                                    </Col>
                                </Row>
                            )
                        })}
                        <Divider />
                        <Row className="address-content" justify="space-between">
                            <Col className="address">
                                {store.valueFooter?.address?.value}
                            </Col>
                            <Col className="phone">
                                {store.valueFooter?.address?.phone.map((item, index) => {
                                    return (
                                        <Row key={index} className="phone-item" wrap={false} >
                                            <Col className="name">{item?.name}</Col>
                                            <Col className="value">{item?.value}</Col>
                                        </Row>
                                    )
                                })}
                            </Col>
                        </Row>
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
        </div >
    );
})