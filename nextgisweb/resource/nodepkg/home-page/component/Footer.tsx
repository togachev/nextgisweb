import { useEffect, useState } from "react";
import { Col, ColorPicker, Row, Button, Form, Divider, Input, Modal } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import Restore from "@nextgisweb/icon/mdi/restore";
import Save from "@nextgisweb/icon/material/save";
import Edit from "@nextgisweb/icon/material/edit";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import Cancel from "@nextgisweb/icon/mdi/cancel";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { HomeStore } from "../HomeStore";
import { UploadComponent } from "./UploadComponent";

import "./Footer.less";

const ColorComponent = observer(({ store }) => {

    const colorsFooter = ["#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF00", "#00FF80", "#00FFFF", "#0080FF", "#0000FF", "#8000FF", "#FF00FF", "#FF0080", "#FFFFFF", "#000000", "#106A90"];

    return (
        <span className="logo-block">
            <span className="edit-logo">
                <Row gutter={[16, 16]} className="item-edit">
                    <Col flex="auto">{gettext("Color background")}</Col>
                    <Col>
                        <Form.Item
                            noStyle
                            name="colorBackground"
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
                                allowClear value={store.valueFooter?.colorText}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={[16, 16]} className="item-edit">
                    <Col flex="auto">{gettext("Color text")}</Col>
                    <Col>
                        <Form.Item
                            noStyle
                            name="colorText"
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
                                allowClear value={store.valueFooter?.colorText} />
                        </Form.Item>
                    </Col>
                </Row>
            </span>
        </span>
    );
});

export const Footer = observer(({ store: storeProp, config }) => {

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState(false);
    const [form] = Form.useForm();
    const [store] = useState(
        () => storeProp || new HomeStore()
    );

    const paramsFileFooter = {
        size: 2, /* KB */
        extension: ".svg",
        type: "image/svg+xml",
        formatName: "SVG",
        className: "upload-footer",
        key: "logo",
        values: "valueFooter",
        valuesInitial: "initialFooter",
        setValues: "setValueFooter",
    }

    const onFinish = (value) => {
        setIsModalOpen(false);
        store.setValueFooter(value);
        store.setInitialFooter(value);
        store.saveSetting(value, "home_page_footer");
    };

    const onValuesChange = () => {
        store.setValueFooter(form.getFieldsValue());
    };

    useEffect(() => {
        try {
            if (status === true) {
                form.resetFields();
                store.setValueFooter(store.initialFooter);
                store.updateStatusFile("done", "logo", "initialFooter", "valueFooter", "setValueFooter")
            }
        } finally {
            setStatus(false);
        }
    }, [status])


    const resetForm = () => {
        setStatus(true);
    };

    const openForm = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        setStatus(true);
    };

    const urlLogo = store.valueFooter?.logo && store.valueFooter?.logo[0]?.status === "done" ? store.valueFooter?.logo[0]?.url : undefined

    return (
        <div className="footer-home-page" style={{ backgroundColor: store.valueFooter?.colorBackground, color: store.valueFooter?.colorText, fontWeight: 500 }}>
            <div className="control-button">
                {config.isAdministrator === true && !isModalOpen && (
                    <Button
                        className="icon-pensil"
                        title={gettext("Edit")}
                        type="default"
                        icon={<Edit />}
                        onClick={openForm}
                    />)}
            </div>
            <Modal
                transitionName=""
                maskTransitionName=""
                style={{ maxWidth: "75%", minWidth: "340px" }}
                width="max-content"
                centered
                footer={null}
                open={isModalOpen}
                title={gettext("Footer title")}
                onCancel={handleCancel}>
                <Form
                    form={form}
                    name="ngw_home_page_footer"
                    autoComplete="off"
                    initialValues={store.initialFooter}
                    onFinish={onFinish}
                    onValuesChange={onValuesChange}
                    clearOnDestroy={true}
                >
                    <Row className="footer-info-edit form-padding">
                        <Col flex="auto">
                            <Row gutter={[16, 16]}>
                                <Col flex={6}>
                                    <Row gutter={[16, 16]}>
                                        <Col flex="auto">
                                            <Row gutter={[16, 16]} className="item-edit-top">
                                                <Col flex="auto">
                                                    <UploadComponent store={store} params={paramsFileFooter} />
                                                </Col>
                                                <Col flex="auto">
                                                    <ColorComponent store={store} />
                                                </Col>
                                            </Row>
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
                                        <Button
                                            title={gettext("Cancel")}
                                            type="default"
                                            icon={<Cancel />}
                                            onClick={handleCancel}
                                        >
                                            {gettext("Cancel")}
                                        </Button>
                                    </Form.Item>
                                </Col>
                                <Col>
                                    <Form.Item noStyle label={null}>
                                        <Button
                                            title={gettext("Reset")}
                                            type="default"
                                            htmlType="reset"
                                            icon={<Restore />}
                                            onClick={resetForm}
                                        >
                                            {gettext("Reset")}
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
            </Modal>
            <Row className="footer-info">
                <Col className="logo-col" flex={1}>
                    <span className="uriit-logo">
                        <img src={urlLogo} />
                    </span>
                </Col>
                <Col flex={4} >
                    <span className="block-info">
                        <Row className="name-center">
                            <Col className="address">{store.valueFooter?.services?.value}</Col>
                        </Row>
                        {store.valueFooter?.services?.list.map((item, index) => {
                            return (
                                <Row key={index} className="services-list">
                                    <Col className="services-url">
                                        <a href={item?.value} target="_blank" style={{ color: store.valueFooter?.colorText }}>
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