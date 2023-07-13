
import "./MapDesc.less";
import { Image } from "@nextgisweb/gui/antd";
import PropTypes from "prop-types";
import parse, { Element, domToReact } from 'html-react-parser';

const MapDesc = ({description, upath_info, widget}) => {
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name == 'img') {
                return <span className="imgDesc"><Image className="imageParse" src={item.attribs.src}>item</Image></span>;
            }
            if (item instanceof Element && item.name == 'a' && !upath_info) {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<a onClick={
                        (e) => {
                            widget.zoomToFeature.apply(widget, item.attribs.href.split(":"))
                        }
                    }>{domToReact(item.children, options)}</a>);
                }
            }
            if (item instanceof Element && item.name == 'a' && upath_info) {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<>{domToReact(item.children, options)}</>);
                }
            }
        }
    };
    const data = parse(description, options);
    return (
        <>
            {/* test */}
            <div className="descItem">{data}</div>
        </>
    )
}

export default MapDesc;
MapDesc.propTypes = {
    description: PropTypes.string,
    upath_info: PropTypes.string,
    widget: PropTypes.object,
};