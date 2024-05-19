import { FC, useMemo, useState, useEffect, useRef } from "react";
import { Dropdown, Empty, Radio, Space, Tooltip, Typography } from "@nextgisweb/gui/antd";
import type { MenuProps } from "@nextgisweb/gui/antd";
import Info from "@nextgisweb/icon/material/info/outline";
import QueryStats from "@nextgisweb/icon/material/query_stats";
import Description from "@nextgisweb/icon/material/description";
import Attachment from "@nextgisweb/icon/material/attachment";
import { useCopy } from "@nextgisweb/webmap/useCopy";
import webmapSettings from "@nextgisweb/pyramid/settings!webmap";
import { gettext } from "@nextgisweb/pyramid/i18n";
import GeometryInfo from "@nextgisweb/feature-layer/geometry-info";

const { Link } = Typography;
const settings = webmapSettings;

export const ContentComponent: FC = ({ store, attribute, position }) => {

    const { copyValue, contextHolder } = useCopy();

    const { id, layerId } = store.selected;
    const panelRef = useRef<HTMLDivElement>(null);

    const heightRadio = 106 + 2 + 2; /* ~ height and padding 2px */
    const [heightPanel, setHeightPanel] = useState();

    const urlRegex = /^\s*(((((https?|http?|ftp|file|e1c):\/\/))|(((mailto|tel):)))[\S]+)\s*$/i;
    const emailRegex = new RegExp(/\S+@\S+\.\S+/);

    const RenderValue = (value) => {
        for (const k in value) {
            const val = value[k];
            if (val !== null) {
                if (urlRegex.test(val)) {
                    return (<Link title={val} className="value-link" ellipsis={true} href={val} target="_blank">{val}</Link>)
                } else if (emailRegex.test(val)) {
                    return (<div title={val} className="value-email" onClick={() => {
                        copyValue(val, gettext("Email address copied"));
                    }} >{val}</div>)
                } else {
                    return (<div className="value text-ellipsis">{val}</div>)
                }
            }
            if (val === null) {
                return (<>{gettext("N/A")}</>)
            }
        }
    };

    const options = [
        {
            label: (<Info />),
            value: "attributes",
            key: "attributes",
            title: gettext("Attributes"),
            hidden: !settings.identify_attributes,
            children:
                (<div>
                    {attribute && Object.keys(attribute).length > 0 ?
                        (<>
                            {Object.keys(attribute).map((key) => {
                                return (
                                    <div key={key} className="item-fields">
                                        <div className="label">{key}</div>
                                        <RenderValue value={attribute[key]} />
                                    </div>
                                )
                            })}
                        </>) :
                        (<Empty style={{ marginBlock: 10 }} image={Empty.PRESENTED_IMAGE_SIMPLE} />)
                    }
                </div>)
        },
        {
            label: (<QueryStats />),
            value: "geom_info",
            key: "geom_info",
            title: gettext("Geometry info"),
            hidden: !settings.show_geometry_info,
            children: (<GeometryInfo layerId={layerId} featureId={id} />)
        },
        {
            label: (<Description />),
            value: "description",
            key: "description",
            title: gettext("Description"),
            hidden: false
        },
        {
            label: (<Attachment />),
            value: "attachment",
            key: "attachment",
            title: gettext("Attachments"),
            hidden: false
        },
    ];

    const [contentItem, setContentItem] = useState(options[0]);

    const items = useMemo(
        () =>
            options.map(item => {
                if (!item.hidden) {
                    return {
                        key: item.key,
                        label: item.label,
                        title: item.title,
                    }
                }
            }),
        [attribute]
    );

    useEffect(() => {
        setHeightPanel(position.height - 70);
        setContentItem(options.find(item => item.key === "attributes"));
    }, [attribute]);

    const onClick: MenuProps['onClick'] = ({ key }) => {
        setContentItem(options.find(item => item.key === key));
    };

    const onValuesChange = (e) => {
        setContentItem(options.find(item => item.key === e.target.value));
    }

    return (
        <>
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
                                                        <Tooltip placement="left" key={i} title={item.title}>
                                                            <Radio.Button value={item.value}>{item.label}</Radio.Button>
                                                        </Tooltip>
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
                                        items,
                                        onClick
                                    }} trigger={["click", "hover"]} >
                                    <Tooltip placement="left" title={options.filter(item => item.key === contentItem.value)[0].title}>
                                        <span className="drop-down-icon">{options.filter(item => item.key === contentItem.value)[0].label}</span>
                                    </Tooltip>
                                </Dropdown>
                            </div>
                        )
                }
            </div>
            <div className="content-item">{contentItem.children}</div>
        </>
    )
};