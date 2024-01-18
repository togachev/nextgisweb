import { useMemo } from "react";

import { KEY_FIELD_KEYNAME } from "../constant";
import type { ColOrder, FeatureLayerFieldCol, OrderBy } from "../type";
import { scrollbarWidth } from "../util/scrollbarWidth";
import type { QueryParams } from "@nextgisweb/feature-layer/feature-grid/hook/useFeatureTable";
import type { SetValue } from "@nextgisweb/feature-layer/feature-grid/type";
import SortIcon from "./SortIcon";

import FilterByData from "@nextgisweb/webmap/filter-by-data";
import { Button, Tooltip } from "@nextgisweb/gui/antd";
import FilterAltOff from "@nextgisweb/icon/material/filter_alt_off";
import { gettext } from "@nextgisweb/pyramid/i18n";
const msgClearFilter = gettext("Clear filter");

interface HeaderColsProps {
    columns: FeatureLayerFieldCol[];
    orderBy?: OrderBy;
    columnRef: React.MutableRefObject<Record<number, HTMLDivElement>>;
    userDefinedWidths: Record<string, number>;
    setOrderBy: React.Dispatch<React.SetStateAction<OrderBy | undefined>>;
    resourceId: number;
    queryParams?: QueryParams;
    setQueryParams: (queryParams: SetValue<QueryParams | null>) => void;
}

export function HeaderCols({
    columns,
    orderBy,
    columnRef,
    userDefinedWidths,
    setOrderBy,
    resourceId,
    queryParams,
    setQueryParams,
}: HeaderColsProps) {
    const scrollBarSize = useMemo<number>(() => scrollbarWidth(), []);

    const toggleSorting = (keyname: string, curOrder: ColOrder = null) => {
        if (keyname === KEY_FIELD_KEYNAME) {
            setOrderBy(undefined);
            return;
        }
        const sortOrderSeq: ColOrder[] = ["asc", "desc", null];
        setOrderBy((old) => {
            if (old) {
                const [oldSortKey, oldSortOrder] = old;
                if (oldSortKey === keyname) {
                    curOrder = oldSortOrder;
                }
            }
            const curOrderIndex = sortOrderSeq.indexOf(curOrder);
            const nextOrderIndex = (curOrderIndex + 1) % sortOrderSeq.length;
            const nextOrder = sortOrderSeq[nextOrderIndex];
            return [keyname, nextOrder];
        });
    };

    return (
        <>
            {columns
                .map((column) => {
                    const { keyname, id, display_name: label, flex } = column;
                    const colSort =
                        orderBy && orderBy[0] === keyname && orderBy[1];

                    const style = userDefinedWidths[id]
                        ? { flex: `0 0 ${userDefinedWidths[id]}px` }
                        : { flex };
                    const dataType = ["DATE", "DATETIME"]
                    
                    const filter_column = queryParams?.fld_field_op?.keyname
                    return (
                        <div
                            key={id}
                            ref={(element) => {
                                if (element) {
                                    columnRef.current[id] = element;
                                }
                            }}
                            className="th"
                            style={style}
                            onClick={() => toggleSorting(keyname)}
                        >
                            <div className="label">{label}</div>
                            <div className="button-column">
                                {colSort && (
                                    <div className="suffix">
                                        <SortIcon dir={colSort} />
                                    </div>
                                )}

                                {
                                    queryParams && filter_column == keyname ?
                                        <Tooltip title={msgClearFilter}>
                                            <Button
                                                type="text"
                                                onClick={() => {
                                                    setQueryParams(null)
                                                }}
                                                icon={<FilterAltOff />}
                                            />
                                        </Tooltip> :
                                        <FilterByData
                                            resourceId={resourceId}
                                            dataType={dataType}
                                            column={column}
                                            queryParams={queryParams}
                                            setQueryParams={setQueryParams}
                                        />
                                }
                            </div>
                        </div>
                    );
                })
                .concat([
                    <div
                        key="scrollbar"
                        style={{ flex: `0 0 ${scrollBarSize}px` }}
                    />,
                ])}
        </>
    );
}