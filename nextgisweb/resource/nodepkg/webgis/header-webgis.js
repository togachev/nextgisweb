import { routeURL } from "@nextgisweb/pyramid/api";
import { Typography } from "@nextgisweb/gui/antd";
const { Title } = Typography;
export const HeaderWebgis = () => {

    const header_image = routeURL('pyramid.header_image')
    return (
        <div
            className="header"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(" + header_image + ")" }}
        >
            <div className="name-site">
                <Title level={1} >Геопортал Центра космических услуг</Title>
                <Title level={5} >цифровые карты Ханты-мансийского автономного округа - Югры</Title>
            </div>
        </div>
    )
}