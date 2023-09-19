import { Row, Col, Space, Typography, Divider } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/uriit_logo.svg";
const { Text, Paragraph, Link } = Typography;

const LogoUriitComp = () => (
    <span className="uriit-logo">
        <LogoUriit />
    </span>
)

export const Footer = () => {
    return (
        <div className="footer-webgis">
            <div className="footer-info">
                <LogoUriitComp />
                <div>
                    <Text className="title-info">Услуги Центра космических услуг</Text>
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
                </div>
            </div>
            <div>
                <Text >© 2002-{new Date().getFullYear()} АУ «Югорский НИИ информационных технологий»</Text>
            </div>
        </div>
    );
}