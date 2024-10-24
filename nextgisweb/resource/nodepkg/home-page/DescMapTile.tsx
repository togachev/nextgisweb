import parse, { Element, domToReact } from "html-react-parser";
import { Image } from "@nextgisweb/gui/antd";

export function DescMapTile(props) {
    const { content, type, upath_info } = props;
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name === "img") {
                return (<Image src={item.attribs.src}>item</Image>);
            }

            if (item instanceof Element && item.attribs && item.name === "p") {
                return <span className="p-padding">{domToReact(item.children, options)}</span>;
            }

            if (item instanceof Element && item.name === "a") {
                item.attribs.target = "_blank"
            }


            if (item instanceof Element && item.name === "a" && upath_info) {
                if (/^\d+:\d+:\d+.*$/.test(item.attribs.href)) {
                    return (<span className="label-delete-link">{domToReact(item.children, options)}</span>);
                }
            }
            if (item instanceof Element && item.name === "a" && type === "feature") {
                if (/^\d+:\d+:\d+.*$/.test(item.attribs.href)) {
                    return (<span className="label-delete-link">{domToReact(item.children, options)}</span>);
                }
            }
        }
    };
    const data = parse(content, options)
    return (<>{data}</>)
}
