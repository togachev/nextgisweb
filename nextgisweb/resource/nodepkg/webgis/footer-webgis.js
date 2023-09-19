import { Row, Col, Space, Typography, Divider } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/logo_uriit.svg";
const { Text, Paragraph, Link } = Typography;

export const FooterWebgis = () => {
    return (
        <>

            <div className="footer-webgis">
                <Row>
                    <Col className="logo-uriit"><LogoUriit /></Col>
                    <Col >
                        <Space className="list-link">
                            <Text >Разработка цифровой карты рыбоводного участка</Text>
                            <Paragraph>
                                <ul>
                                    <li>
                                        <Text >Разработка цифровой карты рыбоводного участка</Text>
                                    </li>
                                    <li>
                                        <Text >Космический мониторинг лесных ресурсов</Text>
                                    </li>
                                    <li>
                                        <Text >Геологическое моделирование трещинных систем нефтяных и газовых месторождений</Text>
                                    </li>
                                </ul>
                            </Paragraph>
                            <Divider />
                        </Space>
                    </Col>
                </Row>
                <Row>
                    <Col>
                        <Text >© 2002-{new Date().getFullYear()} АУ «Югорский НИИ информационных технологий»</Text>
                    </Col>
                </Row>
            </div>
        </>
    );
}