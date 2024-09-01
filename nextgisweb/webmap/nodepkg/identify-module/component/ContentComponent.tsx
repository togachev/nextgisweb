import { FC, useMemo, useState, useEffect, useRef } from "react";
import { ConfigProvider, Descriptions, Dropdown, Empty, Radio, Space, Typography } from "@nextgisweb/gui/antd";
import type { DescriptionsProps, MenuProps } from "@nextgisweb/gui/antd";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Attachment from "@nextgisweb/icon/material/attachment";
import TableRows from "@nextgisweb/icon/material/table_rows";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { gettext } from "@nextgisweb/pyramid/i18n";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";
import { DescComponent } from "@nextgisweb/resource/description";
import { AttachmentTable } from "@nextgisweb/feature-attachment/attachment-table";
import { observer } from "mobx-react-lite";
import { GraphPanel } from "@nextgisweb/webmap/panel/diagram/GraphPanel";
import { LineChartOutlined } from "@ant-design/icons";

const { Link } = Typography;
const settings = webmapSettings;

export const ContentComponent: FC = observer(({ store: storeProp, display, linkToGeometry }) => {
    const [store] = useState(() => storeProp);
    const { attribute, data, extensions, fixContentItem, fixPanel, fixPos, setFixContentItem, setFixPanel, selected, valueRnd } = store;
    const { id, layerId } = selected;
    const { copyValue, contextHolder } = useCopy();
    const panelRef = useRef<HTMLDivElement>(null);

    const firstItem = data.find(i => i.id === id);

    const heightRadio = 135; /* ~ height and padding 2px */
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
            (<Descriptions labelStyle={{ width: "50%" }} bordered size="small" column={1} layout="horizontal" items={items} />) :
            emptyValue;
    };

    const options = [
        {
            label: (<span className="icon-style"><TableRows /></span>),
            value: "attributes",
            key: "attributes",
            title: gettext("Attributes"),
            hidden: !settings.identify_attributes,
            children: attribute ? (<AttributeColumns attribute={attribute} />) :
                emptyValue,
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
            children: extensions !== null && extensions.description !== null ? (<DescComponent display={display} type="feature" content={extensions?.description} />) : emptyValue
        },
        {
            label: (<span className="icon-style"><Attachment /></span>),
            value: "attachment",
            key: "attachment",
            title: gettext("Attachments"),
            hidden: false,
            children: extensions !== null && extensions.attachment !== null ? (<AttachmentTable attachments={extensions?.attachment} isSmall={true} resourceId={layerId} featureId={id} />) : emptyValue
        },
    ];

    if (firstItem.relation) {
        options.push({
            label: (<span className="icon-style"><LineChartOutlined /></span>),
            value: "relation",
            key: "relation",
            title: gettext("Relations"),
            hidden: false,
            children: firstItem && firstItem.relation && (<GraphPanel emptyValue={emptyValue} item={firstItem} store={store} />),
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

    const onClick: MenuProps['onClick'] = ({ key }) => {
        setFixContentItem(options.find(item => item.key === key));
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

    const valueDropdown = items.find(item => item.key === fixContentItem?.value);

    const onValuesChange = (e) => {
        setFixContentItem(options.find(item => item.key === e.target.value));
        setFixPanel(e.target.value);
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
                {linkToGeometry}
            </div>
            <div className="content-item">{fixContentItem?.children}</div>
        </ConfigProvider>
    )
});