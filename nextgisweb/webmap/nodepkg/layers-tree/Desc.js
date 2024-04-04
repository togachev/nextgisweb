import { Dropdown, Card } from "@nextgisweb/gui/antd";
import Description from "@nextgisweb/icon/material/description/outline";
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
                <Description />
            </span>
        );
    }
    const menuProps = {
        items: [{
            key: nodeData.id,
            label: (
                <Card
                    bordered={false}
                    style={{
                        width: 350,
                    }}
                    onClick={(e) => { e.stopPropagation(); }}
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
                <span className="dropdown-content descData" onClick={(e) => { e.stopPropagation(); }}>
                    {menu}
                </span>
            )} >
            <span title="Описание" className="more"
                onClick={(e) => { setDescClickId(id); e.stopPropagation(); }} >
                <Description />
            </span>
        </Dropdown>
    );
}