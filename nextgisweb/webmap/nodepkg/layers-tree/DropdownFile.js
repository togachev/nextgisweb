import { useState, useEffect } from "react";
import { Dropdown } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { PaperClipOutlined } from '@ant-design/icons';
import "./DropdownFile.less";
import { route } from "@nextgisweb/pyramid/api";

const DownloadAttachedFiles = gettext("Download attached files");

export function DropdownFile({
    nodeData,
    fileClickId,
    setFileClickId,
}) {
    const { id, type } = nodeData;
    const [value, setValue] = useState({});

    useEffect(() => {
        let isSubscribed = true;
        const getData = async () => {
            if (nodeData.type === 'layer') {
                const fileRes = await route("file_resource.show", nodeData.styleId).get();
                if (isSubscribed) {
                    setValue(fileRes);
                }
            }
        }
        getData().catch(console.error);
        return () => isSubscribed = false;
    }, []);

    if (type === "root" || type === "group" || !value.status) {
        return <></>;
    }
    if (fileClickId === undefined || fileClickId !== id) {
        return (
            <span
                title={DownloadAttachedFiles}
                className="more"
                onClick={(e) => { setFileClickId(id); e.stopPropagation(); }}
            >
                <PaperClipOutlined />
            </span>
        );
    }

    const menuItems = [];
    value.result?.map((i) => {
        menuItems.push({
            key: i.id,
            label: (
                <>
                    <div className="linkFile" title={i.name}>
                        <a className="a-linkFile" target="_blank" href={i.link} >
                            <span className="fileTitle">{i.res_name}</span>
                            <span className="fileName">{i.name}</span>
                        </a>
                    </div>
                </>
            )
        })
    })

    const menuProps = {
        items: menuItems,
    };

    const onOpenChange = () => {
        setFileClickId(undefined);
    };

    return (
        <>
            {
                value.status ?
                    <Dropdown
                        menu={menuProps}
                        onOpenChange={onOpenChange}
                        trigger={["click"]}
                        open
                        dropdownRender={(menu) => (
                            <div className="dropdown-content customFile" onClick={(e) => { e.stopPropagation(); }}>
                                {menu}
                            </div>
                        )}
                    >
                        <span
                            title={DownloadAttachedFiles}
                            className="more"
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            <PaperClipOutlined />
                        </span>
                    </Dropdown>
                    : null
            }
        </>
    );
}