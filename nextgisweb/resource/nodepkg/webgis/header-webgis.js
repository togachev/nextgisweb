import { routeURL } from "@nextgisweb/pyramid/api";

export const HeaderWebgis = () => {

    const header_image = routeURL('pyramid.header_image')
    return (
        <div
            className="header"
            style={{ background: "linear-gradient(to right, rgba(0,0,0,.6), rgba(0,0,0,.6)), url(" + header_image + ")" }}
        >
        </div>
    )
}