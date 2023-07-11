import { useMemo } from "react";
import PropTypes from "prop-types";
import { Dropdown } from "@nextgisweb/gui/antd";
import "./DropdownIcon.less";
import { IconItem } from "./IconItem";

export function DropdownIcon({
    nodeData,
    legendClickId,
    setIconLegendClickId,
    zoomToNgwExtent
}) {
    const { id, layerCls, legendInfo } = nodeData;
    const iconRes = <svg className="icon"><use xlinkHref={`#icon-rescls-${layerCls}`} /></svg>

    if (legendClickId === undefined || legendClickId !== id) {
        return (
            legendInfo.symbols ?
                <span title="Условное обзначение" className="colIconLegend"
                    onClick={(e) => { setIconLegendClickId(id); e.stopPropagation(); }} >
                    {iconRes}
                </span> :
                <span title="" className="colNot" > {iconRes} </span>
        );
    }

    const prepareIcons = (iconItem) => {
        return (
            <>
                <IconItem
                    item={iconItem}
                    zoomToNgwExtent={zoomToNgwExtent}
                />
            </>
        )
    };

    const IconItems = useMemo(
        () => prepareIcons(nodeData),
        [nodeData]
    );

    const menuItems = [];

    if (legendInfo.symbols) {
        menuItems.push({
            label: IconItems,
            className: 'icon-not-active'
        })
    }

    const menuProps = {
        items: menuItems,
    };

    const onOpenChange = () => {
        setIconLegendClickId(undefined);
    };

    return (
        <Dropdown
            menu={menuProps}
            onOpenChange={onOpenChange}
            trigger={["click"]}
            open
            dropdownRender={(menu) => (
                <div className="dropdown-content LayerIcon" onClick={(e) => { e.stopPropagation(); }}>
                    {menu}
                </div>
            )} >
            {
                legendInfo.symbols ?
                    <span title="Условное обзначение" className="colIconLegend"
                        onClick={(e) => { e.stopPropagation(); }} >
                        {layerCls ? iconRes : null}
                    </span> :
                    <span title="Условное обзначение" className="colNot" >
                        {layerCls ? iconRes : null}
                    </span>
            }
        </Dropdown>
    );
}

DropdownIcon.propTypes = {
    nodeData: PropTypes.object,
    legendClickId: PropTypes.number,
    setIconLegendClickId: PropTypes.func,
    zoomToNgwExtent: PropTypes.func,
};