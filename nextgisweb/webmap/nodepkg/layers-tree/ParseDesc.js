import { Image } from "@nextgisweb/gui/antd";
import parse, { Element } from 'html-react-parser';
import PropTypes from "prop-types";
import "./ParseDesc.less";
import i18n from "@nextgisweb/pyramid/i18n";

const decsTitleStyle = i18n.gettext("Style Description");
const decsTitleLayer = i18n.gettext("Layer resource description");

const ParseDesc = ({ item }) => {
    const descStyle = item.descStyle;
    const descStyleLabel = '<span className="titleDesc">' + decsTitleStyle + ': ' + item.label + '</span>'

    const descLayer = item.descLayer;
    const descLayerLabel = '<span className="titleDesc">' + decsTitleLayer + ': ' + item.labelLayer + '</span>'

    const desc = descStyle && descLayer ? descStyleLabel + descStyle + descLayerLabel + descLayer :    // Описание существует в стиле и слое
        descStyle && !descLayer ? descStyleLabel + descStyle :   // Описание существует только в стиле
            !descStyle && descLayer ? descLayerLabel + descLayer :   // Описание существует только в слое
                null    // Описание отсутсвует

    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name == 'img') {
                return <span className="imgDesc"><Image className="imageParse" src={item.attribs.src}>item</Image></span>;
            }
        }
    };

    const data = parse(desc, options);

    return (
        <>
            <div className="descItem">{data}</div>
        </>
    );
};

export default ParseDesc;

ParseDesc.propTypes = {
    item: PropTypes.object,
    setOpen: PropTypes.func,
};
