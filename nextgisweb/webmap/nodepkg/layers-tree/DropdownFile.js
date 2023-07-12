import PropTypes from "prop-types";
import { Dropdown } from "@nextgisweb/gui/antd";
import i18n from "@nextgisweb/pyramid/i18n";
import { PaperClipOutlined } from '@ant-design/icons';
import "./DropdownFile.less";

const DownloadAttachedFiles = i18n.gettext("Download attached files");

export function DropdownFile({
    nodeData,
    fileClickId,
    setFileClickId,
}) {
    const { id, fileData } = nodeData;

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
    fileData?.map((i) => {
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

    );
}

DropdownFile.propTypes = {
    nodeData: PropTypes.object,
    fileClickId: PropTypes.number,
    setFileClickId: PropTypes.func,
};