import { FC, useMemo, useState, useEffect, useRef } from "react";
import { ConfigProvider, Descriptions, Dropdown, Empty, Radio, Space, Typography } from "@nextgisweb/gui/antd";
import type { DescriptionsProps, MenuProps } from "@nextgisweb/gui/antd";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Attachment from "@nextgisweb/icon/material/attachment";
import TableRows from "@nextgisweb/icon/material/table_rows";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import webmapSettings from "@nextgisweb/webmap/client-settings";
import { gettext } from "@nextgisweb/pyramid/i18n";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";
import { DescComponent } from "@nextgisweb/resource/description";
import { AttachmentTable } from "@nextgisweb/feature-attachment/attachment-table";
import { observer } from "mobx-react-lite";
import { GraphPanel } from "@nextgisweb/webmap/identify-module/component/GraphPanel";
import { LineChartOutlined } from "@ant-design/icons";
import Identifier from "@nextgisweb/icon/mdi/identifier";
import { getEntries } from "@nextgisweb/webmap/identify-module/hook/useSource";

const { Link } = Typography;
const settings = webmapSettings;

const LinkToGeometryFeature = ({ store, display }) => {
    const { selected, linkToGeometry } = store;
    const imodule = display.identify_module;
    const { copyValue, contextHolder } = useCopy();

    if (selected) {
        const item = getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.styleId === selected.styleId)?.[1];

        if (!imodule._isEditEnabled(display, item)) { return false; }
        return (
            <span
                title={gettext("HTML code of the geometry link, for insertion into the description")}
                className="link-button"
                onClick={() => {
                    const linkToGeometryString = `<a href="${linkToGeometry}">${selected.label}</a>`
                    copyValue(linkToGeometryString, gettext("HTML code copied"));
                }}
            >
                {contextHolder}
                <Identifier />
            </span>
        )
    }
};

export const ContentComponent: FC = observer(({ store: storeProp, display }) => {
    const [store] = useState(() => storeProp);
    const { attribute, data, extensions, fixContentItem, fixPanel, fixPos, setFixContentItem, setFixPanel, selected, setCurrentUrlParams, valueRnd } = store;
    const { id, layerId } = selected;
    const { copyValue, contextHolder } = useCopy();
    const panelRef = useRef<HTMLDivElement>(null);

    const opts = display.config.options;
    const attrs = opts["webmap.identification_attributes"];
    const geoms = opts["webmap.identification_geometry"];

    const firstItem = data.find(i => i.id === id);

    const heightRadio = 135; /* ~ height and padding 2px */
    const [heightPanel, setHeightPanel] = useState();

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);
    const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

    const RenderValue = ({ attribute }) => {
        const { datatype, value, format_field } = attribute;
        if (urlRegex.test(value)) {
            return (<Link title={value} href={value} target="_blank">{value}</Link>)
        } else if (emailRegex.test(value)) {
            return (<div className="value-email" title={value} onClick={() => {
                copyValue(value, gettext("Email address copied"));
            }} >{value}</div>)
        }
        else if (datatype === "REAL") {
            const round = format_field?.round !== null ? { maximumFractionDigits: format_field?.round } : {};
            const prefix = format_field?.prefix !== null ? format_field?.prefix : "";
            return format_field?.checked === true && value ?
                new Intl.NumberFormat(navigator.languages[0], { ...round }).format(value) + " " + prefix :
                value;
        }
        else {
            return value
        }
    };

    const AttributeColumns = ({ attribute }) => {
        const items: DescriptionsProps["items"] = [];
        if (attribute.length > 0) {
            if (attribute.length > 1) {
                attribute.map((item) => {
                    if (item.value !== null) {
                        items.push({
                            key: item.key,
                            label: item.attr,
                            children: (<RenderValue attribute={item} />),
                        })
                    }
                })
            } else {
                attribute.map((item) => {
                    if (item.value !== null) {
                        items.push({
                            key: item.key,
                            label: item.attr,
                            children: (<RenderValue attribute={attribute} />),
                        })
                    }
                })
            }
        }

        return items.length > 0 ?
            (<Descriptions
                styles={{ label: { wordBreak: "break-word", width: "calc(50%)" } }}
                bordered
                size="small"
                column={1}
                layout="horizontal"
                items={items}
            />) :
            emptyValue;
    };

    const options: any[] = [];

    if (attrs) {
        options.push({
            label: (<span className="icon-style"><TableRows /></span>),
            value: "attributes",
            key: "attributes",
            title: gettext("Attributes"),
            hidden: !settings.identify_attributes,
            children: attribute ? (<AttributeColumns attribute={attribute} />) :
                emptyValue,
        })
    }

    if (geoms) {
        options.push({
            label: (<span className="icon-style"><QueryStats /></span>),
            value: "geom_info",
            key: "geom_info",
            title: gettext("Geometry info"),
            hidden: !settings.show_geometry_info,
            children: settings.show_geometry_info ? (<GeometryInfo showInfo resourceId={layerId} featureId={id} srid={4326} />) : emptyValue
        })
    }

    options.push({
        label: (<span className="icon-style"><Info /></span>),
        value: "description",
        key: "description",
        title: gettext("Description"),
        hidden: false,
        children: extensions !== null && extensions.description !== null ? (<DescComponent type="feature" display={display} content={extensions?.description} />) : emptyValue
    });

    options.push({
        label: (<span className="icon-style"><Attachment /></span>),
        value: "attachment",
        key: "attachment",
        title: gettext("Attachments"),
        hidden: false,
        children: extensions !== null && extensions.attachment !== null ? (<AttachmentTable attachments={extensions?.attachment} isSmall={true} resourceId={layerId} featureId={id} />) : emptyValue
    });

    if (firstItem.relation) {
        options.push({
            label: (<span className="icon-style"><LineChartOutlined /></span>),
            value: "relation",
            key: "relation",
            title: gettext("Graphs"),
            hidden: false,
            children: firstItem && firstItem.relation && (<GraphPanel item={firstItem} store={store} />),
        })
    }

    useEffect(() => {
        setHeightPanel(valueRnd.height - 70);
        if (fixPos !== null) {
            const result = options.find(item => item.key === fixPanel);
            result ? setFixContentItem(options.find(item => item.key === result.key)) : setFixContentItem(options.find(item => item.key === "attributes"));
        } else {
            const result = options.find(item => item.key === fixPanel);
            result ? setFixContentItem(options.find(item => item.key === result.key)) : setFixContentItem(options.find(item => item.key === "attributes"));
        }
    }, [attribute]);

    const onClick: MenuProps["onClick"] = ({ key }) => {
        setFixContentItem(options.find(item => item.key === key));
        setFixPanel(key);
        setCurrentUrlParams(key);
    };

    const items: MenuProps["items"] = useMemo(() => {
        return options.map(item => {
            if (item.hidden === false) {
                return {
                    key: item.key,
                    label: item.label,
                    title: item.title,
                }
            }
        })
    }, []);

    const valueDropdown = items.find(item => item?.key === fixContentItem?.value);

    const onValuesChange = (e) => {
        setFixContentItem(options.find(item => item.key === e.target.value));
        setFixPanel(e.target.value);
        setCurrentUrlParams(e.target.value);
    }

    return (
        <ConfigProvider
            theme={{
                token: {
                    borderRadiusLG: 0,
                    padding: 5,
                    paddingXS: 2,
                },
            }}
        >
            {contextHolder}
            <div className="radio-block">
                {
                    heightPanel > heightRadio ?
                        (
                            <div ref={panelRef} className="radio-group" >
                                <Radio.Group
                                    buttonStyle="solid"
                                    onChange={onValuesChange}
                                    value={fixContentItem?.value}
                                    className="radio-component"
                                >
                                    <Space direction="vertical" style={{ rowGap: 2, padding: 2 }} >
                                        {
                                            options.map((item, i) => {
                                                if (!item.hidden) {
                                                    return (
                                                        <Radio.Button key={i} title={item.title} value={item.value}>{item.label}</Radio.Button>
                                                    )
                                                }
                                            })
                                        }
                                    </Space>
                                </Radio.Group>
                            </div>
                        ) :
                        (<div className="dropdown-block">
                            <Dropdown placement="bottomLeft"
                                menu={{ items, onClick }} trigger={["click"]} >
                                <span title={valueDropdown?.title} className="drop-down-icon">{valueDropdown?.label}</span>
                            </Dropdown>
                        </div>)
                }
                <LinkToGeometryFeature store={store} display={display} />
            </div>
            <div className="content-item">{fixContentItem?.children}</div>
        </ConfigProvider>
    )
});