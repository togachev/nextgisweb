import { useMemo, useState, useEffect, useRef } from "react";
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
import { GraphPanel } from "@nextgisweb/webmap/imodule/component/GraphPanel";
import { LineChartOutlined } from "@ant-design/icons";
import Identifier from "@nextgisweb/icon/mdi/identifier";
import { getEntries } from "@nextgisweb/webmap/imodule/useSource";
import { formattedFields } from "@nextgisweb/feature-layer/feature-grid/util/formattedFields";

import type { OptionProps, ContentProps } from "../type";

const { Link } = Typography;
const settings = webmapSettings;

const LinkToGeometryFeature = ({ store, display }) => {
    const imodule = display.imodule;
    const { copyValue, contextHolder } = useCopy();

    if (store.selected) {
        const item = getEntries(display.webmapStore._layers).find(([_, itm]) => itm.itemConfig.styleId === store.selected.styleId)?.[1];

        if (!imodule._isEditEnabled(display, item)) { return false; }
        return (
            <span
                title={gettext("HTML code of the geometry link, for insertion into the description")}
                className="link-button"
                onClick={() => {
                    const linkToGeometryString = `<a href="${store.linkToGeometry}">${store.selected.label}</a>`
                    copyValue(linkToGeometryString, gettext("HTML code copied"));
                }}
            >
                {contextHolder}
                <Identifier />
            </span>
        )
    }
};

export const ContentComponent = observer((props) => {
    const { store: storeProp, display } = props as ContentProps
    const [store] = useState(() => storeProp);
    const { id, layerId } = store.selected;
    const { copyValue, contextHolder } = useCopy();
    const { getNumberValue } = formattedFields();
    const panelRef = useRef<HTMLDivElement>(null);

    const opts = display.config.options;
    const attrs = opts["webmap.identification_attributes"];
    const geoms = opts["webmap.identification_geometry"];

    const firstItem = store.data.find(i => i.id === id);

    const heightRadio = 135; /* ~ height and padding 2px */
    const [heightPanel, setHeightPanel] = useState<number>(0);

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);
    const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

    const RenderValue = ({ attribute }) => {
        const { value } = attribute;

        if (urlRegex.test(value)) {
            return (<Link title={value} href={value} target="_blank">{value}</Link>)
        } else if (emailRegex.test(value)) {
            return (<div className="value-email" title={value} onClick={() => {
                copyValue(value, gettext("Email address copied"));
            }} >{value}</div>)
        } else {
            return getNumberValue(attribute);
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
                            children: (<RenderValue attribute={item} />),
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

    const options: OptionProps[] = [];

    if (attrs) {
        options.push({
            label: (<span className="icon-style"><TableRows /></span>),
            value: "attributes",
            key: "attributes",
            title: gettext("Attributes"),
            hidden: !settings.identify_attributes,
            children: store.attribute ? (<AttributeColumns attribute={store.attribute} />) :
                emptyValue,
        })
    }


    if (store.selected.type === "vector") {
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
            children: store.extensions !== null && store.extensions.description !== null ? (<DescComponent type="feature" display={display} content={store.extensions?.description} />) : emptyValue
        });

        options.push({
            label: (<span className="icon-style"><Attachment /></span>),
            value: "attachment",
            key: "attachment",
            title: gettext("Attachments"),
            hidden: false,
            children: store.extensions !== null && store.extensions.attachment !== null ? (<AttachmentTable attachments={store.extensions?.attachment} isSmall={true} resourceId={layerId} featureId={id} />) : emptyValue
        });

        if (firstItem?.relation) {
            const graphProps = { item: firstItem, store: store }
            options.push({
                label: (<span className="icon-style"><LineChartOutlined /></span>),
                value: "relation",
                key: "relation",
                title: gettext("Graphs"),
                hidden: false,
                children: firstItem && firstItem.relation && (<GraphPanel {...graphProps} />),
            })
        }
    }





    useEffect(() => {
        setHeightPanel(store.valueRnd.height - 70);
        if (store.fixPos !== null) {
            const result = options.find(item => item.key === store.fixPanel);
            result ? store.setFixContentItem(options.find(item => item.key === result.key)) : store.setFixContentItem(options.find(item => item.key === "attributes"));
        } else {
            const result = options.find(item => item.key === store.fixPanel);
            result ?
                store.setFixContentItem(options.find(item => item.key === result.key)) :
                store.setFixContentItem(options.find(item => item.key === "attributes"));
        }
    }, [store.attribute]);

    const onClick: MenuProps["onClick"] = ({ key }) => {
        store.setFixContentItem(options.find(item => item.key === key));
        store.setFixPanel(key);
        store.setCurrentUrlParams(key);
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

    const valueDropdown = items.find(item => item?.key === store.fixContentItem?.value);

    const onValuesChange = (e) => {
        store.setFixContentItem(options.find(item => item.key === e.target.value));
        store.setFixPanel(e.target.value);
        store.setCurrentUrlParams(e.target.value);
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
                                    value={store.fixContentItem?.value}
                                    className="radio-component"
                                >
                                    <Space direction="vertical" style={{ rowGap: 2, padding: 2 }} >
                                        {
                                            options.map((item, i) => {
                                                if (!item.hidden) {
                                                    return (
                                                        <Radio.Button key={i} title={item.title} value={item.value}>
                                                            {item.label}
                                                        </Radio.Button>
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
            <div className="content-item">{store.fixContentItem?.children}</div>
        </ConfigProvider>
    )
});