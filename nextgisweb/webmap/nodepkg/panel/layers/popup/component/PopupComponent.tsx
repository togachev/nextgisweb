import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { Button, ConfigProvider, Space } from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import CloseIcon from "@nextgisweb/icon/material/close";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { Store } from "../Store";
export default observer(
    // forwardRef<Element>(
    function PopupComponent(props) {
        console.log(props);

        // const { position, display } = props;
        // console.log(position);


        // const [store] = useState(
        //     () => new Store({
        //         display: display,
        //         valueRnd: {
        //             x: position.x,
        //             y: position.y,
        //             width: position.width,
        //             height: position.height,
        //         },
        //         sizeWindow: {
        //             width: window.innerWidth,
        //             height: window.innerHeight,
        //         },
        //     }));
        const { popup_destroy, popup_width, popup_height, setValueRnd, sizeWindow, valueRnd } = props.store;
        console.log(popup_width, popup_height, setValueRnd, sizeWindow, valueRnd);

        const W = sizeWindow.width;
        const H = sizeWindow.height;
        // useEffect(() => {
        //     setValueRnd({ x: position.x, y: position.y, width: position.width, height: position.height });
        // }, []);

        return (
            <ConfigProvider
                theme={{
                    token: {
                        colorPrimary: "#106a90",
                    },
                    components: {
                        Dropdown: {
                            paddingBlock: 5,
                            controlPaddingHorizontal: 5,
                            controlItemBgActiveHover: "var(--divider-color)",
                            colorPrimary: "var(--text-base)",
                            lineHeight: 1,
                        },
                        Radio: {
                            buttonPaddingInline: 3,
                            colorPrimary: "var(--primary)",
                            colorBorder: "transparent",
                            borderRadius: 4,
                            controlHeight: 24,
                            fontSize: 16,
                            lineWidth: 1,
                            lineHeight: 1,
                            paddingXS: 50
                        },
                        Select: {
                            optionSelectedBg: "var(--divider-color)",
                            colorPrimaryHover: "var(--divider-color)",
                            colorPrimary: "var(--text-secondary)",
                            controlOutline: "var(--divider-color)",
                            colorBorder: "var(--divider-color)",
                        },
                        Button: {
                            colorLink: "var(--text-base)",
                            colorLinkHover: "var(--primary)",
                            defaultHoverColor: "var(--primary)",
                            borderRadius: 4,
                        },
                        Tag: {
                            colorFillSecondary: "#00000010",
                            defaultColor: "var(--text-secondary)",
                            colorPrimary: "var(--primary)",
                            colorPrimaryActive: "#00000010",
                            colorPrimaryHover: "#00000010",
                            borderRadiusSM: 2,
                        },
                        Message: {
                            colorSuccess: "var(--primary)",
                        }
                    }
                }}
            >
                <Rnd
                    style={{ zIndex: 10 }}
                    resizeHandleClasses={{
                        right: "hover-right",
                        left: "hover-left",
                        top: "hover-top",
                        bottom: "hover-bottom",
                        bottomRight: "hover-angle-bottom-right",
                        bottomLeft: "hover-angle-bottom-left",
                        topRight: "hover-angle-top-right",
                        topLeft: "hover-angle-top-left",
                    }}
                    cancel=".select-feature,.select-feature-forbidden,.radio-block,.radio-group,.value-link,.value-email,.icon-symbol,.coordinate-value,.link-value,.content-item"
                    bounds={props.store.valueRnd.width === W ? undefined : "window"}
                    minWidth={props.position.width}
                    minHeight={props.position.height}
                    allowAnyClick={true}
                    enableResizing={
                        // countFeature > 0 ? (fixPos === null ? 
                        true
                        // : false) : false
                    }
                    disableDragging={
                        // countFeature > 0 && fixPos !== null ? true :
                        false
                    }
                    position={
                        // countFeature > 0 && fixPos !== null ? { x: fixPos?.x, y: fixPos?.y } : 
                        { x: props.store.valueRnd.x, y: props.store.valueRnd.y }}
                    size={
                        // countFeature > 0 && fixPos !== null ? { width: fixPos?.width, height: fixPos?.height } : 
                        { width: props.store.valueRnd.width, height: props.store.valueRnd.height }}
                    onDragStop={(e, d) => {
                        if (props.store.valueRnd?.x !== d.x || props.store.valueRnd?.y !== d.y) {
                            props.store.setValueRnd({ ...props.store.valueRnd, x: d.x, y: d.y });
                            // console.log({ x: d.x, y: d.y });
                            // if (valueRnd.width === sizeWindow.width && valueRnd.height === sizeWindow.height) {
                            //     setValueRnd({ ...valueRnd, width: valueRnd.width, height: valueRnd.height, x: valueRnd.x, y: valueRnd.y });
                            //     // setFullscreen(false);
                            // }
                        }
                    }}
                    onResize={(e, direction, ref, delta, position) => {
                        props.store.setValueRnd({ ...props.store.valueRnd, width: ref.offsetWidth, height: ref.offsetHeight, x: position.x, y: position.y });
                    }}
                >
                    <div className="popup">
                        <Space direction="vertical">
                            <Button
                                icon={<CloseIcon />}
                                title={gettext("Close")}
                                onClick={() => {
                                    popup_destroy();
                                }} />
                        </Space>
                    </div>
                </Rnd >
            </ConfigProvider>
        )
    }
    // )
);