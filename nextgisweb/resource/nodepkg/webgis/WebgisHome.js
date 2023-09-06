import React from 'react';
import './WebgisHome.less';
import { Button, Layout, Menu, theme, Space, Col, Divider, Row } from "@nextgisweb/gui/antd";
import {
    LaptopOutlined, NotificationOutlined, UserOutlined,

    PieChartOutlined,
    ContainerOutlined,
    DesktopOutlined,

} from '@ant-design/icons';

function getItem(label, key, icon, children, type) {
    return {
        key,
        icon,
        children,
        label,
        type,
    };
}
const items = [
    getItem('Option 1', '1', <PieChartOutlined />),
    getItem('Option 2', '2', <DesktopOutlined />),
    getItem('Option 3', '3', <ContainerOutlined />),
];
const { Header, Footer, Sider, Content } = Layout;

const headerStyle = {
    textAlign: "center",
    color: "#000",
    height: '200px',
    paddingInline: 50,
    lineHeight: "200px",
    backgroundColor: "#fff",
    borderBottom: "0.005em dotted black"
};
const contentStyleSelect = {
    textAlign: "left",
    padding: '0px 0px 0px 10px',
    height: 40,
    lineHeight: "40px",
    color: "#000",
    backgroundColor: "#fff",
    borderBottom: "0.005em dotted black"
};
const contentStyleMenu = {
    textAlign: "center",
    minHeight: 'calc(100vh - 128px)',
    width: '100%',
    maxWidth: '300px',
    minWidth: '200px',
    lineHeight: "120px",
    color: "#000",
    backgroundColor: "#fff",
    borderRight: "0.005em dotted black"
};
const contentStyle = {
    textAlign: 'center',
    minHeight: '350px',
    minWidth: '350px',
    color: '#000',
    backgroundColor: '#106a9005',
    wordBreak: 'break-all',
    padding: '16px',
};
const siderStyleLeft = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#000",
    backgroundColor: "#fff",
    borderRight: "0.005em dotted black"
};
const siderStyleRight = {
    textAlign: "center",
    lineHeight: "120px",
    color: "#000",
    backgroundColor: "#fff",
    borderLeft: "0.005em dotted black"
};
const footerStyle = {
    textAlign: "center",
    height: '200px',
    paddingInline: 50,
    lineHeight: "200px",
    color: "#000",
    backgroundColor: "#fff",
    borderTop: "0.005em dotted black"
};

export function WebgisHome() {
    return (
        <Space
            direction="vertical"
            style={{
                width: '100%',
            }}
            size={[0, 48]}
        >
            <Layout>
                <Header style={headerStyle}>Header</Header>
                <Layout>
                    <Sider style={siderStyleLeft}></Sider>
                    <Content>
                        <Layout>
                            <Content style={contentStyleSelect}>Select or Search maps</Content>
                            <Content>
                                <Layout hasSider>
                                    <Content style={contentStyleMenu}>

                                        <Menu
                                            style={{
                                                height: 'calc(100vh - 128px)'
                                            }}
                                            mode="inline"
                                            theme="light"
                                            items={items}
                                        />

                                    </Content>
                                    <Content style={contentStyle}>
                                        <Layout>
                                            <Content style={contentStyle}>
                                                <Row>
                                                    <Col
                                                        xs={{ span: 5, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                    <Col
                                                        xs={{ span: 11, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                    <Col
                                                        xs={{ span: 5, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                </Row>
                                            </Content>
                                            <Content style={contentStyle}>
                                                <Row>
                                                    <Col
                                                        xs={{ span: 5, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                    <Col
                                                        xs={{ span: 11, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                    <Col
                                                        xs={{ span: 5, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                </Row>
                                            </Content>
                                            <Content style={contentStyle}>
                                                <Row>
                                                    <Col
                                                        xs={{ span: 5, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                    <Col
                                                        xs={{ span: 11, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                    <Col
                                                        xs={{ span: 5, offset: 1, }}
                                                        lg={{ span: 6, offset: 2, }}
                                                    >
                                                        Col
                                                    </Col>
                                                </Row>
                                            </Content>
                                        </Layout>
                                    </Content>
                                </Layout>
                            </Content>
                        </Layout>
                    </Content>
                    <Sider style={siderStyleRight}></Sider>
                </Layout>
                <Footer style={footerStyle}>Footer</Footer>
            </Layout>
        </Space>
    )
}