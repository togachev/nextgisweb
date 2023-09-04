import { Image } from "@nextgisweb/gui/antd";
import parse, { Element } from 'html-react-parser';
import "./ParseDesc.less";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Tabs } from 'antd';
import { FloatingLabel } from "@nextgisweb/gui/floating-label";

const decsTitleStyle = gettext("Style");
const decsTitleLayer = gettext("Layer resource");

const ParseDesc = ({ item }) => {
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name == 'img') {
                return <span className="imgDesc"><Image className="imageParse" src={item.attribs.src}>item</Image></span>;
            }
        }
    };
    console.log(item.label);
    const TitleDesc = ({title}) => { return (<span className="titleDesc">{title}</span>)}

    const descStyle = item.descStyle;
    const ds = {
        label: <FloatingLabel label={decsTitleStyle} ><TitleDesc title={item.label} /></FloatingLabel>,
        children: descStyle ? parse(descStyle, options) : null,
    }

    const descLayer = item.descLayer;
    const dl = {
        label: <FloatingLabel label={decsTitleLayer} ><TitleDesc title={item.label} /></FloatingLabel>,
        children: descLayer ? parse(descLayer, options) : null,
    }

    const arrayDesc = []

    const items = descStyle && descLayer ? [...arrayDesc, Object.assign(ds, {key: 1}), Object.assign(dl, {key: 2})] :    // Описание существует в стиле и слое
        descStyle && !descLayer ? [...arrayDesc, Object.assign(ds, {key: 1})] :   // Описание существует только в стиле
            !descStyle && descLayer ? [...arrayDesc, Object.assign(dl, {key: 1})] :   // Описание существует только в слое
                null    // Описание отсутсвует

    return (
        <Tabs type="card" items={items} />
    )
};

export default ParseDesc;