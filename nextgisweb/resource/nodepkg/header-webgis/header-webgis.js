
import { route, routeURL } from "@nextgisweb/pyramid/api";
import './header-webgis.less';
import { Layout, Space } from "@nextgisweb/gui/antd";

export function HeaderWebgis() {

    const header_image = routeURL('pyramid.header_image')
    return (
        <div className="header"
            style={{ backgroundImage: "url(" + header_image + ")" }}
        >
        </div>
    )
}