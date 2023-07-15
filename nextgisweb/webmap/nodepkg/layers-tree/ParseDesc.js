import { Image } from "@nextgisweb/gui/antd";
import parse, { Element } from 'html-react-parser';
import PropTypes from "prop-types";
import "./ParseDesc.less";
import i18n from "@nextgisweb/pyramid/i18n";
import { Tabs } from 'antd';

const decsTitleStyle = i18n.gettext("Style Description");
const decsTitleLayer = i18n.gettext("Layer resource description");

const ParseDesc = ({ item }) => {
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name == 'img') {
                return <span className="imgDesc"><Image className="imageParse" src={item.attribs.src}>item</Image></span>;
            }
        }
    };

    const TitleDesc = ({title}) => { return (<span className="titleDesc">{title}</span>)}

    const descStyle = item.descStyle;
    const ds = {
        label: <TitleDesc title={decsTitleStyle} />,
        children: descStyle ? parse(descStyle, options) : null,
    }

    const descLayer = item.descLayer;
    const dl = {
        label: <TitleDesc title={decsTitleLayer} />,
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

ParseDesc.propTypes = {
    item: PropTypes.object
};
