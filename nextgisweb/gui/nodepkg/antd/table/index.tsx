import { Table as TableBase } from "antd";
import type { AnyObject } from "antd/es/_util/type";
import type { TableProps as AntTableProps } from "antd/es/table";

import "./index.less";

export interface TableProps<D = any> extends AntTableProps<D> {
    parentHeight?: boolean;
}

export default function Table<D extends AnyObject = AnyObject>({
    className,
    parentHeight = false,
    pagination = false,
    ...props
}: TableProps<D>) {
    if (parentHeight) {
        className = (className ? className.split(" ") : [])
            .concat("ant-table-parent-height")
            .join(" ");
    }

    const tableProps: AntTableProps<D> = { ...props, pagination, className };

    return <TableBase {...tableProps} />;
}

Table.EXPAND_COLUMN = TableBase.EXPAND_COLUMN;
Table.SELECTION_ALL = TableBase.SELECTION_ALL;
Table.SELECTION_COLUMN = TableBase.SELECTION_COLUMN;
Table.SELECTION_INVERT = TableBase.SELECTION_INVERT;
Table.SELECTION_NONE = TableBase.SELECTION_NONE;

Table.Column = TableBase.Column;
Table.ColumnGroup = TableBase.ColumnGroup;
Table.Summary = TableBase.Summary;

export type { ColumnProps } from "antd/es/table";
