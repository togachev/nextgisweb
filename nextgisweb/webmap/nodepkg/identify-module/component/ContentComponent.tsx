import { FC, useMemo, useState, useEffect, useRef } from "react";
import { Button, ConfigProvider, Descriptions, Dropdown, Empty, Radio, Space, Typography } from "@nextgisweb/gui/antd";
import type { DescriptionsProps, MenuProps } from "@nextgisweb/gui/antd";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Attachment from "@nextgisweb/icon/material/attachment";
import Identifier from "@nextgisweb/icon/mdi/identifier";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { gettext } from "@nextgisweb/pyramid/i18n";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";
import { DescComponent } from "@nextgisweb/resource/description";
import { AttachmentTable } from "@nextgisweb/feature-attachment/attachment-table";
import { useRouteGet } from "@nextgisweb/pyramid/hook";
import { Attribute } from "@nextgisweb/webmap/icon";
import topic from "dojo/topic";
import { useSource } from "../hook/useSource";
import { DisplayItemConfig } from "@nextgisweb/webmap/panels-manager/type";

const { Link } = Typography;
const settings = webmapSettings;

export const ContentComponent: FC = ({ store, display }) => {
    const { attribute, data, linkToGeometry, selected, setAttribute, setContextUrl, setLinkToGeometry, setUpdateContent, updateContent, valueRnd } = store;
    const { id, layerId } = selected;
    const { copyValue, contextHolder } = useCopy();
    const { generateUrl, getAttribute } = useSource();
    const imodule = display.identify_module;
    const panelRef = useRef<HTMLDivElement>(null);

    const heightRadio = 110; /* ~ height and padding 2px */
    const [heightPanel, setHeightPanel] = useState();
    const [contentItem, setContentItem] = useState("attributes");

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);
    const emptyValue = (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)

    useEffect(() => {
        (async () => {
            const value = await getAttribute(selected);
            const noSelectedItem = data.filter(item => item.value !== selected.value);
            setContextUrl(generateUrl(display, { res: selected, all: noSelectedItem }));
            setLinkToGeometry(value.resourceId + ":" + value.feature.id);
            setAttribute(value.updateName);
            topic.publish("feature.highlight", {
                geom: value.feature.geom,
                featureId: value.feature.id,
                layerId: value.resourceId,
            })
        })();
    }, [selected]);

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

    const { data: extensions, refresh: refreshAttach } = useRouteGet({
        name: "feature_layer.feature.extensions",
        params: {
            id: layerId,
            fid: id,
        },
    })

    const AttributeColumns = ({ attribute }) => {
        const items: DescriptionsProps['items'] = [];
        if (Object.keys(attribute).length > 0) {
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

        return items.length > 0 ?
            (<Descriptions bordered size="small" column={1} layout="hirizontal" items={items} />) :
            emptyValue;
    };

    const options = [
        {
            label: (<span className="icon-style"><Attribute /></span>),
            value: "attributes",
            key: "attributes",
            title: gettext("Attributes"),
            hidden: !settings.identify_attributes,
            children: attribute && (<AttributeColumns attribute={attribute} />),
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

    useEffect(() => {
        setHeightPanel(valueRnd.height - 70);
        setContentItem(options.find(item => item.key === "attributes"));
    }, [store.attribute]);

    useEffect(() => {
        if (updateContent === true) {
            refreshAttach();
            setUpdateContent(false);
        }
    }, [updateContent])

    const onClick: MenuProps['onClick'] = ({ key }) => {
        setContentItem(options.find(item => item.key === key));
    };

    const items: MenuProps['items'] = useMemo(() => {
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

    const valueDropdown = items.find(item => item.key === contentItem.value);

    const onValuesChange = (e) => {
        setContentItem(options.find(item => item.key === e.target.value));
    }

    const LinkToGeometry = useMemo(() => {
        const item = Object.values(display._layers).find((itm: DisplayItemConfig) => itm.itemConfig.styleId === selected.styleId);
        if (!imodule._isEditEnabled(display, item)) { return false; }
        return (<Button
            size="small"
            type="link"
            title={gettext("HTML code of the geometry link, for insertion into the description")}
            className="copy_to_clipboard"
            icon={<Identifier />}
            onClick={() => {
                const linkToGeometryString = `<a href="${linkToGeometry}">${selected.label}</a>`
                copyValue(linkToGeometryString, gettext("Object reference copied"))
            }}
        />)
    }, [store.attribute])

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
                                    value={contentItem.value}
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
                {LinkToGeometry}
            </div>
            <div className="content-item">{contentItem.children}</div>
        </ConfigProvider>
    )
};