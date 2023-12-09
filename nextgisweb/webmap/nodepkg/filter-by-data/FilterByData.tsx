import { useCallback, useEffect, useMemo, useRef, useState } from "react";


import { Button, Dropdown, Space, DatePicker, Checkbox, message, Card } from "@nextgisweb/gui/antd";
import { Balancer } from "react-wrap-balancer";
import type { SizeType } from "@nextgisweb/gui/antd";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { DojoDisplay, WebmapItem } from "../type";
import type WebmapStore from "../store";
import History from "@nextgisweb/icon/material/history";

interface FilterByDataBtnProps {
    nodeData: WebmapItem;
    display: DojoDisplay;
    store: WebmapStore;
    size?: SizeType;
}
const { RangePicker } = DatePicker;
const InfoCard = () => (
    <Card size="small">
        <Balancer >{msgInfo}</Balancer>
    </Card>
);


const msgShowLayerFilterByDate = gettext("Show layer filter by date");
const msgInfo = gettext("Turn on a layer to get information about an object");


export const FilterByData = ({
    nodeData,
    display,
    store,
    size = "middle",
}: FilterByDataBtnProps) => {
    console.log(nodeData, display);

    return (
        <Dropdown
            dropdownRender={() => (
                <>
                    <span className="date-picker-panel" onClick={(e) => { e.stopPropagation(); }}>
                        <RangePicker
                            allowClear={false}
                        />
                    </span>
                    {store.checked.includes(nodeData.id) ? <></> : <InfoCard />}
                </>
            )}
        >
            <Button title={msgShowLayerFilterByDate} size={size}>
                <Space>
                    <History />
                </Space>
            </Button>
        </Dropdown>
    );
};
