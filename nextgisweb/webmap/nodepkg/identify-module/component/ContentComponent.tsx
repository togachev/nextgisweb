import { FC, useMemo, useState, useEffect, useRef } from "react";
import { ConfigProvider, Descriptions, Dropdown, Empty, Radio, Space, Typography } from "@nextgisweb/gui/antd";
import type { DescriptionsProps, MenuProps } from "@nextgisweb/gui/antd";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Attachment from "@nextgisweb/icon/material/attachment";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { gettext } from "@nextgisweb/pyramid/i18n";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";
import { DescComponent } from "@nextgisweb/resource/description";
import { AttachmentTable } from "@nextgisweb/feature-attachment/attachment-table";
import { useRouteGet } from "@nextgisweb/pyramid/hook";
import { Attribute } from "@nextgisweb/webmap/icon";

const { Link } = Typography;
const settings = webmapSettings;

export const ContentComponent: FC = ({ store, attribute, LinkToGeometry, display }) => {

    const { copyValue, contextHolder } = useCopy();
    const { valueRnd } = store;
    const { id, layerId } = store.selected;
    const panelRef = useRef<HTMLDivElement>(null);

    const heightRadio = 110; /* ~ height and padding 2px */
    const [heightPanel, setHeightPanel] = useState();

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);
    const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

    const RenderValue = (value) => {
        for (const k in value) {
            const val = value[k];
            if (urlRegex.test(val)) {
                return (<Link title={val} href={val} target="_blank">{val}</Link>)
            } else if (emailRegex.test(val)) {
                return (<div className="value-email" title={val} onClick={() => {
                    copyValue(val, gettext("Email address copied"));
                }} >{val}</div>)
            } else {
                return val
            }
        }
    };

    const { data: extensions, refresh: refreshAttach } = store.selected && useRouteGet({
        name: "feature_layer.feature.extensions",
        params: {
            id: layerId,
            fid: id,
        }
    })
    
    const options = [
        {
            label: (<span className="icon-style"><Attribute /></span>),
            value: "attributes",
            key: "attributes",
            title: gettext("Attributes"),
            hidden: !settings.identify_attributes,
            children: null
        },
        {
            label: (<span className="icon-style"><QueryStats /></span>),
            value: "geom_info",
            key: "geom_info",
            title: gettext("Geometry info"),
            hidden: !settings.show_geometry_info,
            children: settings.show_geometry_info ? (<GeometryInfo layerId={layerId} featureId={id} />) : emptyValue
        },
        {
            label: (<span className="icon-style"><Info /></span>),
            value: "description",
            key: "description",
            title: gettext("Description"),
            hidden: false,
            children: extensions?.description ? (<DescComponent display={display} type="feature" content={extensions?.description} />) : emptyValue
        },
        {
            label: (<span className="icon-style"><Attachment /></span>),
            value: "attachment",
            key: "attachment",
            title: gettext("Attachments"),
            hidden: false,
            children: extensions?.attachment ? (<AttachmentTable attachments={extensions?.attachment} isSmall={true} resourceId={layerId} featureId={id} />) : emptyValue
        },
    ];

    const attributeColumns = useMemo(() => {
        const items: DescriptionsProps['items'] = [];

        if (attribute && Object.keys(attribute).length > 0) {
            if (Object.keys(attribute).length > 1) {
                Object.keys(attribute).map((key) => {
                    if (attribute[key] !== null) {
                        items.push({
                            key: key,
                            label: key,
                            children: (<RenderValue value={attribute[key]} />),
                        })
                    }
                })
            } else {
                Object.keys(attribute).map((key) => {
                    if (attribute[key] !== null) {
                        items.push({
                            key: key,
                            label: key,
                            children: (<RenderValue value={attribute[key]} />),
                        })
                    }
                })
            }
        }

        return <Descriptions bordered size="small" column={1} layout="hirizontal" items={items} />;
    }, [attribute]);

    options[0].children = attributeColumns.props.items.length > 0 ? attributeColumns : emptyValue;

    const [contentItem, setContentItem] = useState(options[0]);

    const dropdownItems = useMemo(() => {
        options.map(item => {
            if (!item.hidden) {
                return {
                    key: item.key,
                    label: item.label,
                    title: item.title,
                }
            }
        })
    }, [attribute]);

    useEffect(() => {
        if (store.updateContent === true) {
            refreshAttach();
            store.setUpdateContent(false);
        }
    }, [store.updateContent])

    useEffect(() => {
        setHeightPanel(valueRnd.height - 70);
        setContentItem(options.find(item => item.key === "attributes"));
    }, [attribute]);

    const onClick: MenuProps['onClick'] = ({ key }) => {
        setContentItem(options.find(item => item.key === key));
    };

    const onValuesChange = (e) => {
        setContentItem(options.find(item => item.key === e.target.value));
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
                                <Radio.Group buttonStyle="solid" onChange={onValuesChange} value={contentItem.value} className="radio-component" >
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
                        (
                            <div className="dropdown-block">
                                <Dropdown placement="bottomLeft"
                                    menu={{
                                        dropdownItems,
                                        onClick
                                    }} trigger={["click", "hover"]} >
                                    <span title={options.filter(item => item.key === contentItem.value)[0].title} className="drop-down-icon">{options.filter(item => item.key === contentItem.value)[0].label}</span>
                                </Dropdown>
                            </div>
                        )
                }
                {LinkToGeometry}
            </div>
            <div className="content-item">{contentItem.children}</div>
        </ConfigProvider>
    )
};