import { useEffect, useState } from "react";
import { Col, ColorPicker, Row, Button, Form, Divider, Input, Space } from "@nextgisweb/gui/antd";
import { observer } from "mobx-react-lite";
import { routeURL } from "@nextgisweb/pyramid/api";
import DeleteOffOutline from "@nextgisweb/icon/mdi/delete-off-outline";
import Cog from "@nextgisweb/icon/mdi/cog";
import CardAccountPhone from "@nextgisweb/icon/mdi/card-account-phone";
import LinkEdit from "@nextgisweb/icon/mdi/link-edit";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { UploadComponent, ControlForm, ModalComponent } from ".";
import { useReload } from "./useReload";

import "./Footer.less";

const ColorComponent = observer(({ store }) => {

    const colorsFooter = ["#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF00", "#00FF80", "#00FFFF", "#0080FF", "#0000FF", "#8000FF", "#FF00FF", "#FF0080", "#FFFFFF", "#000000", "#106A90"];

    return (
        <Space direction="horizontal" wrap>
            <Space direction="horizontal" wrap={false}>
                {gettext("Color background")}
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
                        allowClear value={store.valueFooter?.colorBackground}
                    />
                </Form.Item>
            </Space>
            <Space direction="horizontal" wrap={false}>
                {gettext("Color text")}
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
            </Space>
        </Space>
    );
});

export const Footer = observer(({ store }) => {
    const [status, setStatus] = useState(false);
    const [open, setOpen] = useState(false);
    const [reload, reloading] = useReload();
    const [form] = Form.useForm();

    const paramsFileFooter = {
        size: 2, /* KB */
        extension: ".svg",
        type: "image/svg+xml",
        formatName: "SVG",
        className: "upload-footer",
        key: "img",
        values: "valueFooter",
        valuesInitial: "initialFooter",
        setValues: "setValueFooter",
        hkey: "footer",
    }

    const onFinish = (value) => {
        console.log(value);
        
        setOpen(false);
        store.setValueFooter(value);
        store.setInitialFooter(value);
        store.saveSetting(value, "home_page_footer");
        store.setUrlImg({ ...store.ulrImg, footer: value.img ? value.img[0]?.url : "" });
        reload();
    };

    const onValuesChange = (changedValues: any, values: any) => {
        store.setValueFooter(values);
    };

    useEffect(() => {
        try {
            if (status === true) {
                form.resetFields();
                store.setValueFooter(store.initialFooter);
                store.updateStatusFile("done", "img", "initialFooter", "valueFooter", "setValueFooter")
                store.initialFooter?.img && store.initialFooter?.img[0]?.status === "done" ?
                    store.setUrlImg({ ...store.ulrImg, footer: routeURL("pyramid.asset.himg", { ikey: "home_page_footer" }) + `?ckey=${store.config.ckey}` }) :
                    store.setUrlImg({ ...store.ulrImg, footer: "" });
            }
        } finally {
            setStatus(false);
        }
    }, [status])


    const resetForm = () => {
        setStatus(true);
    };

    const openForm = () => {
        setOpen(true)
    };

    const handleCancel = () => {
        setStatus(true);
        setOpen(false);
    };

    const formFooter = (
        <Form
            form={form}
            name="ngw_home_page_footer"
            autoComplete="off"
            initialValues={store.initialFooter}
            onFinish={onFinish}
            onValuesChange={onValuesChange}
            clearOnDestroy={true}
            className="form-component"
        >
            <Space className="content" direction="vertical">
                <UploadComponent store={store} params={paramsFileFooter} />
                <ColorComponent store={store} />
                <Form.Item noStyle name={"service_name"}>
                    <Input allowClear placeholder="name" />
                </Form.Item>
                <Form.List name={"service"}>
                    {(fields, { add, remove }) => (
                        <>
                            <Space direction="vertical" style={{ width: "100%" }} wrap>
                                <Button
                                    className="item-edit"
                                    onClick={() => add()}
                                    icon={<LinkEdit />}
                                    title={gettext("Add url menu")}
                                    type="default"
                                >
                                    {gettext("Add url menu")}
                                </Button>
                                {fields.map((field, index) => (
                                    <Space.Compact block key={index} >
                                        <Form.Item noStyle name={[field.name, "name"]}>
                                            <Input type="text" allowClear placeholder={gettext("Name url")} />
                                        </Form.Item>
                                        <Form.Item noStyle name={[field.name, "value"]}>
                                            <Input type="text" allowClear placeholder={gettext("Url")} />
                                        </Form.Item>
                                        <Button
                                            onClick={() => {
                                                remove(field.name);
                                            }}
                                            icon={<DeleteOffOutline />}
                                            type="default"
                                            title={gettext("Remove url menu")}
                                        />
                                    </Space.Compact>
                                ))}
                            </Space>
                        </>
                    )}
                </Form.List>
                <Form.Item noStyle name={"address_name"}>
                    <Input allowClear placeholder="value" />
                </Form.Item>
                <Form.List name={"address_phone"}>
                    {(fields, { add, remove }) => (
                        <Space direction="vertical" style={{ width: "100%" }} wrap>
                            <Button
                                className="item-edit"
                                onClick={() => add()}
                                icon={<CardAccountPhone />}
                                title={gettext("Add contact")}
                                type="default"
                            >
                                {gettext("Add contact")}
                            </Button>
                            {fields.map((field, index) => (
                                <Space.Compact block key={index} >
                                    <Form.Item noStyle name={[field.name, "name"]}>
                                        <Input allowClear />
                                    </Form.Item>
                                    <Form.Item noStyle name={[field.name, "value"]}>
                                        <Input allowClear />
                                    </Form.Item>
                                    <Button
                                        onClick={() => {
                                            remove(field.name);
                                        }}
                                        icon={<DeleteOffOutline />}
                                        type="default"
                                        title={gettext("Remove contact")}
                                    />
                                </Space.Compact>
                            ))}

                        </Space>
                    )}
                </Form.List>

                <Form.Item noStyle name={"base_year"}>
                    <Input allowClear placeholder="base_year" />
                </Form.Item>
                <Form.Item noStyle name={"footer_name"}>
                    <Input allowClear placeholder="name" />
                </Form.Item>
                <span className="control-component">
                    <ControlForm handleCancel={handleCancel} resetForm={resetForm} />
                </span>
            </Space>
        </Form>
    )

    return (
        <div className="footer-home-page" style={{ backgroundColor: store.valueFooter?.colorBackground ? store.valueFooter?.colorBackground : "var(--icon-color)", color: store.valueFooter?.colorText, fontWeight: 500 }}>
            <div className="control-button">
                {store.config.isAdministrator === true && !open && (
                    <Button
                        className="icon-pensil"
                        title={gettext("Setting footer")}
                        type="text"
                        icon={<Cog />}
                        onClick={openForm}
                    />)}
            </div>
            <ModalComponent title={gettext("Footer setting")} form={formFooter} open={open} handleCancel={handleCancel} />
            <Row className="footer-info">
                <Col className="logo-col" flex={1}>
                    <span className="uriit-logo">
                        <img src={reloading ? null : store.ulrImg?.footer ? store.ulrImg.footer : ""} />
                    </span>
                </Col>
                <Col flex={4} >
                    <span className="block-info">
                        <Row className="name-center">
                            <Col className="address">{store.valueFooter?.service_name}</Col>
                        </Row>
                        {store.valueFooter?.service?.map((item, index) => {
                            return (
                                <Row key={index} className="service-list">
                                    <Col className="service-url">
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
                                {store.valueFooter?.address_name}
                            </Col>
                            <Col className="phone">
                                {store.valueFooter?.address_phone?.map((item, index) => {
                                    return (
                                        <Space key={index} className="phone-item" wrap>
                                            <div className="name">{item?.name}</div>
                                            <div className="value">{item?.value}</div>
                                        </Space>
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
                        © {store.valueFooter?.base_year}-{new Date().getFullYear()} {store.valueFooter?.footer_name}
                    </div>
                </Col>
            </Row>
        </div >
    );
})