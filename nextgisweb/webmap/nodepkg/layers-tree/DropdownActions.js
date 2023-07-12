import PropTypes from "prop-types";
import i18n from "@nextgisweb/pyramid/i18n";
import { Dropdown, Divider, Space } from "@nextgisweb/gui/antd";
import { SvgIcon } from "@nextgisweb/gui/svg-icon";

import { ControlOutlined } from '@ant-design/icons';

import "./DropdownActions.less";

const AdditionalTools = i18n.gettext("Additional tools");

export function DropdownActions({
    nodeData,
    getWebmapPlugins,
    moreClickId,
    setMoreClickId,
    update,
    setUpdate,
}) {
    const { id, type } = nodeData;
    if (type === "root" || type === "group") {
        return <></>;
    }
    if (moreClickId === undefined || moreClickId !== id) {
        return (
            <span
                title={AdditionalTools}
                className="more"
                onClick={() => {
                    setMoreClickId(id);
                }}
            >
                <ControlOutlined />
            </span>
        );
    }

    const menuItems = [];
    const customMenuItems = [];
    const plugins = getWebmapPlugins();
    for (const keyPlugin in plugins) {
        const plugin = plugins[keyPlugin];
        if (!plugin || !plugin.getPluginState) {
            continue;
        }
        const pluginInfo = plugin.getPluginState(nodeData);
        if (pluginInfo.enabled) {
            if (plugin.getMenuItem) {
                const { icon, title, onClick } = plugin.getMenuItem(nodeData);
                const onClick_ = async () => {
                    const run = onClick || plugin.run;
                    if (plugin && run) {
                        const result = await run(nodeData);
                        if (result !== undefined) {
                            setUpdate(!update);
                        }
                    }
                    setMoreClickId(undefined);
                };

                menuItems.push({
                    key: keyPlugin,
                    onClick: onClick_,
                    label: (
                        <>
                            <span className="iconSize">
                                {typeof icon === "string" ? (
                                    <SvgIcon icon={icon} fill="currentColor" />
                                ) : (
                                    icon
                                )}
                            </span>
                            <span>{title}</span>
                        </>
                    ),
                });
            } else if (plugin.render) {
                customMenuItems.push(plugin.render.bind(plugin, pluginInfo));
            }
        }
    }

    const menuProps = {
        items: menuItems,
    };

    const onOpenChange = () => {
        setMoreClickId(undefined);
    };

    return (
        <Dropdown
            menu={menuProps}
            overlayClassName="tree-item-menu"
            onOpenChange={onOpenChange}
            trigger={["click"]}
            destroyPopupOnHide
            open
            placement="bottomRight"
            dropdownRender={(menu) => (
                <div className="dropdown-content customStyle">
                    {menu}
                    {customMenuItems.length ? (
                        <>
                            <Divider style={{ margin: 0 }} />
                            <Space
                                style={{ padding: "5px 12px", width: "100%" }}
                                direction="vertical"
                            >
                                {customMenuItems.map((Item, i) => (
                                    <Item key={i}></Item>
                                ))}
                            </Space>
                        </>
                    ) : (
                        ""
                    )}
                </div>
            )}
        >
            <span className="more">
                <ControlOutlined />
            </span>
        </Dropdown>
    );
}

DropdownActions.propTypes = {
    nodeData: PropTypes.object,
    getWebmapPlugins: PropTypes.func,
    moreClickId: PropTypes.number,
    setMoreClickId: PropTypes.func,
    update: PropTypes.bool,
    setUpdate: PropTypes.func,
};
