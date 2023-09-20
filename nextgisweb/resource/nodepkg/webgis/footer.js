import { Typography, Divider, Row, Col } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/uriit_logo.svg";
import { RightOutlined } from '@ant-design/icons';
import i18n from "@nextgisweb/pyramid/i18n";
import './footer.less';

const { Text } = Typography;

const LogoUriitComp = () => (
    <span className="uriit-logo">
        <LogoUriit />
    </span>
)

const info = [
    { key: 'address', label: "", value: "Россия, 628011 Ханты-Мансийск ул. Мира, д. 151" },
    { key: "reception", label: i18n.gettext("Приемная"), value: "+7 (3467) 360-100" },
    { key: "office", label: i18n.gettext("Канцелярия"), value: "+7 (3467) 360-100 доб. 6030" },
    { key: "fax", label: i18n.gettext("Факс"), value: "+7 (3467) 360-101" },
    { key: "email", label: "E-mail", value: "OFFICE@URIIT.RU" },
    {
        key: "services", label: "", value: i18n.gettext("Услуги Центра космических услуг"),
        list: [
            { key: "office", label: "", value: i18n.gettext("Разработка цифровой карты рыбоводного участках") },
            { key: "fax", label: "", value: i18n.gettext("Космический мониторинг лесных ресурсов") },
            { key: "email", label: "", value: i18n.gettext("Геологическое моделирование трещинных систем нефтяных и газовых месторождений") },
        ]
    },
]

export const Footer = () => {
    return (
        <div className="footer-webgis">
            <div className="footer-info">
                <LogoUriitComp />
                <div className="block-info">
                    <Row className="content-services">
                        <Col className="services-a">{info.find((e) => e.key == 'services').value}</Col>
                        <Col>{info.find((e) => e.key == 'services').list.map(item => {
                            return (
                                <Row key={item.key}><RightOutlined /><Col className="services-b">{item.value}</Col></Row>
                            )
                        })}</Col>
                    </Row>
                    <Divider />
                    <Row className="content-info">
                        <Col className="info-a">{info.find((e) => e.key == 'address').value}</Col>
                        <Col className="info-b">{info.filter((e) => e.key !== 'address' && e.key !== 'services').map(item => {
                            return (
                                <Row key={item.key} className="info-b-item">
                                    <Col className="item-c">{item.label}</Col>
                                    <Col className="item-d">{item.value}</Col>
                                </Row>
                            )
                        })}</Col>

                    </Row>
                </div>
            </div>
            <Text className="uriit-footer-name">© 2002-{new Date().getFullYear()} АУ «Югорский НИИ информационных технологий»</Text>
        </div>
    );
}