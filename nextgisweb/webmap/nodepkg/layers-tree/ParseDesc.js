import { Image } from "@nextgisweb/gui/antd";
import parse, { Element } from 'html-react-parser';
import PropTypes from "prop-types";
import "./ParseDesc.less";
const ParseDesc = ({ item }) => {

    const descStyle = item.description;
    const descLayer = item.plugin['ngw-webmap/plugin/LayerInfo'].description;
    const interval = '<p style="margin: 20px"></p>'
    const desc = descStyle && descLayer ? descStyle + interval + descLayer :    // Описание существует в стиле и слое
        descStyle && !descLayer ? descStyle :   // Описание существует только в стиле
            !descStyle && descLayer ? descLayer :   // Описание существует только в слое
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
