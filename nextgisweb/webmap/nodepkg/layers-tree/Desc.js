import PropTypes from "prop-types";
import { Dropdown, Card } from "@nextgisweb/gui/antd";
import { FileTextOutlined } from '@ant-design/icons';
import "./Desc.less";
import ParseDesc from "./ParseDesc"

export function Desc({
    nodeData,
    descClickId,
    setDescClickId
}) {

    const { id } = nodeData;


    if (descClickId === undefined || descClickId !== id) {
        return (
            <span title="Описание" className="more"
                onClick={(e) => { setDescClickId(id); e.stopPropagation(); }} >
                <FileTextOutlined />
            </span>
        );
    }
    const menuProps = {
        items: [{
            key: nodeData.id,
            label: (
                <Card
                    title={nodeData.label}
                    bordered={false}
                    style={{
                        width: 350,
                    }}
                >
                    <ParseDesc item={nodeData} />
                </Card>
            )
        }],
    };

    const onOpenChange = () => {
        setDescClickId(undefined);
    };

    return (
        <Dropdown
            overlayClassName="descData"
            menu={menuProps}
            onOpenChange={onOpenChange}
            trigger={["click"]}
            open
            dropdownRender={(menu) => (
                <div className="dropdown-content descData" onClick={(e) => { e.stopPropagation(); }}>
                    {menu}
                </div>
            )} >
            <span title="Описание" className="more"
                onClick={(e) => { setDescClickId(id); e.stopPropagation(); }} >
                <FileTextOutlined />
            </span>
        </Dropdown>
    );
}

Desc.propTypes = {
    nodeData: PropTypes.object,
    descClickId: PropTypes.number,
    setDescClickId: PropTypes.func,
};