import { useState } from "react";
import { Image } from "@nextgisweb/gui/antd";
import parse, { Element } from 'html-react-parser';
import PropTypes from "prop-types";
import "./ParseDesc.less";
import i18n from "@nextgisweb/pyramid/i18n";

import { Collapse } from 'antd';
const { Panel } = Collapse;

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

    const descStyleLabel = '<span className="titleDesc">' + decsTitleStyle + ': ' + item.label + '</span>';
    const descStyle = item.descStyle;
    const ds = { key: 1, label: descStyleLabel, children: parse(descStyle, options) }

    const descLayerLabel = '<span className="titleDesc">' + decsTitleLayer + ': ' + item.labelLayer + '</span>';
    const descLayer = item.descLayer;
    const dl = { key: 2, label: descLayerLabel, children: parse(descLayer, options) }

    const arrayDesc = []

    const newArray = descStyle && descLayer ? [...arrayDesc, ds, dl] :    // Описание существует в стиле и слое
        descStyle && !descLayer ? [...arrayDesc, ds] :   // Описание существует только в стиле
            !descStyle && descLayer ? [...arrayDesc, dl] :   // Описание существует только в слое
                null    // Описание отсутсвует

    console.log(newArray);

    // const onChange = (key) => {
    //     console.log(key);
    // };
    // return <Collapse items={newArray} onChange={onChange} />;
};

export default ParseDesc;

ParseDesc.propTypes = {
    item: PropTypes.object,
    setOpen: PropTypes.func,
};
