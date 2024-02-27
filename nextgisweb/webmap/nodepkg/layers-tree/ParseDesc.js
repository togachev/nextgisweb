import { Image } from "@nextgisweb/gui/antd";
import parse, { Element, domToReact } from 'html-react-parser';
import "./ParseDesc.less";
import { Tabs, Tooltip } from 'antd';
import { Balancer } from "react-wrap-balancer";

const ParseDesc = ({ item }) => {
    const options = {
        replace: item => {
            if (item instanceof Element && item.attribs && item.name === 'img') {
                return <span className="imgDesc"><Image className="imageParse" src={item.attribs.src}>item</Image></span>;
            }
            if (item instanceof Element && item.attribs && item.name === 'p') {
                return <span className="test"><Balancer >{domToReact(item.children, options)}</Balancer></span>;
            }
        }
    };

    const TitleDesc = ({ label, title }) => {
        return (
            <Tooltip className="titleDesc" title={label} >
                {title}
            </Tooltip>
        )
    }

    const descStyle = item.descStyle;
    const ds = {
        label: <TitleDesc label={item.label} title={item.label} />,
        children: descStyle ? parse(descStyle, options) : null,
    }

    const descLayer = item.descLayer;
    const dl = {
        label: <TitleDesc label={item.labelLayer} title={item.labelLayer} />,
        children: descLayer ? parse(descLayer, options) : null,
    }

    const arrayDesc = []

    const items = descStyle && descLayer ? [...arrayDesc, Object.assign(ds, { key: 1 }), Object.assign(dl, { key: 2 })] :    // Описание существует в стиле и слое
        descStyle && !descLayer ? [...arrayDesc, Object.assign(ds, { key: 1 })] :   // Описание существует только в стиле
            !descStyle && descLayer ? [...arrayDesc, Object.assign(dl, { key: 1 })] :   // Описание существует только в слое
                null    // Описание отсутсвует

    return (
        <Tabs type="card" items={items} />
    )
};

export default ParseDesc;