
import "./FeatureDesc.less";
import { Image } from "@nextgisweb/gui/antd";
import PropTypes from "prop-types";
import parse, { Element } from 'html-react-parser';

export const FeatureDesc = ({description}) => {
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name == 'img') {
                return <span className="imgDesc"><Image className="imageParse" src={item.attribs.src}>item</Image></span>;
            }
        }
    };
    const data = parse(description, options);
    return (
        <>
            <div className="descItemMap">{data}</div>
        </>
    )
}

export default FeatureDesc;
FeatureDesc.propTypes = {
    description: PropTypes.string,
};