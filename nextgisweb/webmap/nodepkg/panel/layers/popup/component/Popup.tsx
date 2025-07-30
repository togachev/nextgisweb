import { observer } from "mobx-react-lite";
import { forwardRef, useEffect, useState } from "react";
import { Button, ConfigProvider, Space } from "@nextgisweb/gui/antd";
import { Rnd } from "react-rnd";
import CloseIcon from "@nextgisweb/icon/material/close";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { PopupStore } from "../PopupStore";

export default function Popup(props) {
    console.log(props);
    return (
        <div
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                backgroundColor: "#eee",
                width: 100,
                height: 100,
                zIndex: 10,
            }}
        >
            test
        </div>
    )
    // const { pointPopupClick, offset, popup_height, popup_height } = props.store;
    // return (
    //     <div
    //         ref={ref}
    // style={{
    //     position: "absolute",
    //     top: 0,
    //     left: 0,
    //     backgroundColor: "#eee",
    //     width: popup_height,
    //     height: popup_height,
    //     zIndex: 10,
    // }}
    //     >
    //         {lonlat[0]} {lonlat[1]}
    //     </div>
    // )
};