
import "./MapDesc.less";
import { Image } from "@nextgisweb/gui/antd";
import parse, { Element, domToReact } from 'html-react-parser';

const zoomToFeature = (display, resourceId, featureId) => {
    display
        .featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then(feature => {
            display.map.zoomToFeature(feature);
        });
};

export const MapDesc = ({ description, display, upath_info }) => {
    console.log({ description, display, upath_info });
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name === 'img') {
                return (<span className="img-style">
                    <span className="img-item">
                        <Image src={item.attribs.src}>item</Image>
                    </span>
                </span>);
            }
            if (item instanceof Element && item.attribs && item.name === 'p') {
                return <span className="p-padding">{domToReact(item.children, options)}</span>;
            }
            if (item instanceof Element && item.name === 'a' && !upath_info) {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<a onClick={
                        () => {
                            const [resId, fid] = item.attribs.href.split(":");
                            zoomToFeature(display, resId, fid);
                        }
                    }>{domToReact(item.children, options)}</a>);
                }
            }
            /*
                Если открыты свойства ресурса, ссылка на объект удаляется, остается заголовок.
                Можно оставить ссылку, и добавить переход к объекту в таблице ресурса или к объекту на карте.
            */
            if (item instanceof Element && item.name === 'a' && upath_info) {
                if (/^\d+:\d+$/.test(item.attribs.href)) {
                    return (<>{domToReact(item.children, options)}</>);
                }
            }
        }
    };
    const data = parse(description, options);
    return (
        <div className="descItemMap">{data}</div>
    )
}

export default MapDesc;