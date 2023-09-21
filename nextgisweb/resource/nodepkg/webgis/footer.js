import { Typography, Divider } from "@nextgisweb/gui/antd";
import LogoUriit from "./icons/uriit_logo.svg";
import { RightOutlined } from '@ant-design/icons';
import i18n from "@nextgisweb/pyramid/i18n";
import './footer.less';

const { Text, Link } = Typography;

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
            {
                key: "office", label: i18n.gettext("Разработка цифровой карты рыбоводного участках"),
                value: 'https://uriit.ru/services/infospace-technologies/kosmicheskiy-monitoring-vodnykh-obektov/'
            },
            {
                key: "fax", label: i18n.gettext("Космический мониторинг лесных ресурсов"),
                value: 'https://uriit.ru/services/infospace-technologies/kosmicheskiy-monitoring-lesnogo-fonda/'
            },
            {
                key: "email", label: i18n.gettext("Геологическое моделирование трещинных систем нефтяных и газовых месторождений"),
                value: 'https://uriit.ru/services/geological-modelling/'
            },
        ]
    },
]

export const Footer = () => {
    return (
        <div className="footer-webgis">
            <div className="footer-info">
                <LogoUriitComp />
                <div className="block-info">
                    <div className="content-services">
                        <div className="services-a">{info.find((e) => e.key == 'services').value}</div>
                        <div className="services-b">{info.find((e) => e.key == 'services').list.map(item => {
                            return (
                                <span key={item.key}><Link href={item.value} target="_blank"><RightOutlined />{item.label}</Link></span>
                            )
                        })}</div>
                    </div>
                    <Divider />
                    <div className="content-info">
                        <div className="info-a">{info.find((e) => e.key == 'address').value}</div>
                        <div className="info-b">{info.filter((e) => e.key !== 'address' && e.key !== 'services').map(item => {
                            return (
                                <div key={item.key} className="info-b-item">
                                    <div className="item-c">{item.label}</div>
                                    <div className="item-d">{item.value}</div>
                                </div>
                            )
                        })}</div>

                    </div>
                </div>
            </div>
            <Text className="uriit-footer-name">© 2002-{new Date().getFullYear()} АУ «Югорский НИИ информационных технологий»</Text>
        </div>
    );
}