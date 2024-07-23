import { useState } from "react";
import { Button, Checkbox, Modal } from "@nextgisweb/gui/antd";
import type { CheckboxProps } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { observer } from "mobx-react-lite";

const title = gettext("Setting the order of drawing layers on a web map");
const customize = gettext("Customize");
const enableIdentifyOrder = gettext("Link layer identification on web map to layer order");
const enableDrawOrder = gettext("Enable/disable layer orders");


export const LayerOrderSettings = observer((props) => {
    // const [isModalOpen, setIsModalOpen] = useState(false);
    // const { store } = props;
    console.log(props);

    // const showModal = () => {
    //     setIsModalOpen(true);
    // };

    // const handleOk = () => {
    //     setIsModalOpen(false);
    // };

    // const handleCancel = () => {
    //     setIsModalOpen(false);
    // };

    // const identifyOrderChange: CheckboxProps['onChange'] = (e) => {
    //     store.update({ identifyOrderEnabled: e.target.checked });
    // };

    // const drawOrderOrderChange: CheckboxProps['onChange'] = (e) => {
    //     store.update({ drawOrderEnabled: e.target.checked });
    // };

    return (
        <>
            <Button
                size="small"
                style={{ maxWidth: "15em" }}
                title={title}
                // onClick={showModal}
            >
                {customize}
            </Button>
            {/* <Modal title="Basic Modal" open={isModalOpen} onOk={handleOk} onCancel={handleCancel}>
                <Checkbox checked={store.identifyOrderEnabled} onChange={identifyOrderChange}>
                    {enableIdentifyOrder}
                </Checkbox>
                <Checkbox checked={store.drawOrderEnabled} onChange={drawOrderOrderChange}>
                    {enableDrawOrder}
                </Checkbox>
            </Modal> */}
        </>

    );
});