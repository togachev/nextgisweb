import parse, { Element, domToReact } from 'html-react-parser';
import { gettext } from "@nextgisweb/pyramid/i18n";
import { PanelHeader } from "../header";
import { Image } from "@nextgisweb/gui/antd";
import { SvgIconLink } from "@nextgisweb/gui/svg-icon";
import "./DescriptionPanel.less";
import { DescComponent } from "@nextgisweb/resource/description";
const title = gettext("Description");
const msgLayer = gettext("Layer");
const msgStyle = gettext("Style");

const zoomToFeature = (display, resourceId, featureId) => {
    display.featureHighlighter
        .highlightFeatureById(featureId, resourceId)
        .then((feature) => {
            display.map.zoomToFeature(feature);
        });
};

export function DescriptionPanel(props) {
    const { display, type, upath_info, content, close, visible } = props

    return (<DescComponent display={display} type={type} upath_info={upath_info} content={content} close={close} visible={visible}/>)
    // const options = {
    //     replace: item => {
    //         if (item instanceof Element && item.attribs && item.name === 'img') {
    //             return (<span className="img-style">
    //                 <span className="img-item">
    //                     <Image src={item.attribs.src}>item</Image>
    //                 </span>
    //             </span>);
    //         }

    //         if (item instanceof Element && item.attribs && item.name === 'p') {
    //             return <span className="p-padding">{domToReact(item.children, options)}</span>;
    //         }

    //         if (item instanceof Element && item.name === 'a') {
    //             item.attribs.target = '_blank'
    //         }

    //         if (item instanceof Element && item.name === 'a' && !upath_info && type !== "feature") {
    //             if (/^\d+:\d+$/.test(item.attribs.href)) {
    //                 return (<a onClick={
    //                     () => {
    //                         const [resId, fid] = item.attribs.href.split(":");
    //                         zoomToFeature(display, resId, fid);
    //                     }
    //                 }>{domToReact(item.children, options)}</a>);
    //             }
    //         }
    //         /*
    //             Если открыты свойства ресурса, ссылка на объект удаляется, остается заголовок.
    //             Можно оставить ссылку, и добавить переход к объекту в таблице ресурса или к объекту на карте.
    //         */
    //         if (item instanceof Element && item.name === 'a' && upath_info) {
    //             if (/^\d+:\d+$/.test(item.attribs.href)) {
    //                 return (<span className="label-delete-link">{domToReact(item.children, options)}</span>);
    //             }
    //         }
    //         if (item instanceof Element && item.name === 'a' && type === "feature") {
    //             if (/^\d+:\d+$/.test(item.attribs.href)) {
    //                 return (<span className="label-delete-link">{domToReact(item.children, options)}</span>);
    //             }
    //         }
    //     }
    // };

    // const DescComp = ({ content }) => {
    //     return (
    //         <>{
    //             content.map((item, index) => {
    //                 const title = item.type === "layer" ? msgLayer : msgStyle;
    //                 return (
    //                     <div key={index} className="item-description">
    //                         <span className="titleDesc">
    //                             {item.permissions ?
    //                                 (<SvgIconLink
    //                                     className="desc-link"
    //                                     href={item.url}
    //                                     icon={`rescls-${item.cls}`}
    //                                     fill="currentColor"
    //                                     target="_blank"
    //                                 >
    //                                     <span className="labelDesc">{title}</span>
    //                                 </SvgIconLink>)
    //                                 : (<span className="labelDesc">{title}</span>)
    //                             }
    //                         </span>
    //                         {parse(item.description, options)}
    //                     </div >
    //                 )
    //             })

    //         }</>
    //     )
    // }
    // let data;
    // if (content === undefined && type === "map") {
    //     data = parse(display.config.webmapDescription, options)
    // }
    // else if (content instanceof Array && type === "map") {
    //     data = (<DescComp content={content} />)
    // }
    // else if (type === "resource" || type === "feature") {
    //     data = parse(content, options)
    // }

    // return (
    //     <div className="ngw-webmap-description-panel">
    //         {type === "map" && (<PanelHeader {...{ title, close }} />)}
    //         {data}
    //     </div>
    // )
}
