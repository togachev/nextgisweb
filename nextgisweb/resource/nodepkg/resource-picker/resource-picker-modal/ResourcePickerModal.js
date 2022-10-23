import "./ResourcePickerModal.css";

import { Modal } from "@nextgisweb/gui/antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";

import { ResourcePickerChildren } from "../resource-picker-children";
import { ResourcePickerStore } from "../store/ResourcePickerStore";
import { ResourcePickerModalFooter } from "./ResourcePickerModalFooter";
import { ResourcePickerModalTitle } from "./ResourcePickerModalTitle";

const DEFAULTS = {
    centered: true,
    width: "40em",
    transitionName: "",
    maskTransitionName: "",
};

export function ResourcePickerModal({
    showCls = ["resource_group"],
    onSelect,
    enabledCls = ["resource_group"],
    onNewGroup,
    resourceId,
    getThisMsg,
    disabledIds,
    closeOnSelect = true,
    getSelectedMsg,
    ...props
}) {
    const [visible, setVisible] = useState(props.visible ?? true);

    const [resourceStore] = useState(
        new ResourcePickerStore({
            parentId: resourceId,
            getSelectedMsg,
            getThisMsg,
            disabledIds,
            enabledCls,
            onNewGroup,
            showCls,
        })
    );
    const close = () => setVisible(false);

    const onOk = (resource) => {
        if (onSelect) {
            onSelect(resource);
        }
        if (closeOnSelect) {
            close();
        }
    };

    useEffect(() => {
        return () => resourceStore.destroy();
    });

    useEffect(() => {
        setVisible(props.visible);
    }, [props.visible]);

    return (
        <Modal
            {...DEFAULTS}
            {...props}
            open={visible}
            destroyOnClose
            className="resource-picker-modal"
            bodyStyle={{
                overflowY: "auto",
                minHeight: "400px",
                maxHeight: "calc(50vh - 200px)",
                padding: "0",
            }}
            closable={false}
            onCancel={() => setVisible(false)}
            title={
                <ResourcePickerModalTitle
                    onClose={close}
                    resourceStore={resourceStore}
                />
            }
            footer={
                <ResourcePickerModalFooter
                    resourceStore={resourceStore}
                    allowCreateResourceBtn
                    onOk={onOk}
                />
            }
        >
            <ResourcePickerChildren
                resourceStore={resourceStore}
                enabledCls={["resource_group"]}
            />
        </Modal>
    );
}

ResourcePickerModal.propTypes = {
    visible: PropTypes.bool,
    closeOnSelect: PropTypes.bool,
    disabledIds: PropTypes.arrayOf(PropTypes.number),
    enabledCls: PropTypes.array,
    getSelectedMsg: PropTypes.string,
    getThisMsg: PropTypes.string,
    onNewGroup: PropTypes.any,
    onSelect: PropTypes.func,
    resourceId: PropTypes.number,
    showCls: PropTypes.array,
};
