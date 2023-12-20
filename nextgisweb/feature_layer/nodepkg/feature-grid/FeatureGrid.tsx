import isEqual from "lodash-es/isEqual";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import type { ActionToolbarAction } from "@nextgisweb/gui/action-toolbar";
import { Button, Empty, Tooltip } from "@nextgisweb/gui/antd";
import type { SizeType } from "@nextgisweb/gui/antd";
import { LoadingWrapper } from "@nextgisweb/gui/component";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { gettext } from "@nextgisweb/pyramid/i18n";
import type { ResourceItem } from "@nextgisweb/resource/type/Resource";

import type { FeatureLayerCount } from "../type/FeatureLayer";

import { FeatureGridActions } from "./FeatureGridActions";
import FeatureTable from "./FeatureTable";
import TableConfigModal from "./component/TableConfigModal";
import { KEY_FIELD_ID, KEY_FIELD_KEYNAME } from "./constant";
import type { FeatureAttrs } from "./type";

import RefreshIcon from "@nextgisweb/icon/material/refresh";
import TuneIcon from "@nextgisweb/icon/material/tune";

import "./FeatureGrid.less";

export interface ActionProps {
    id: number;
    query: string;
    size?: SizeType;
    selected?: FeatureAttrs[];
}

export interface FeatureGridProps {
    id: number;
    size?: SizeType;
    query?: string;
    actions?: ActionToolbarAction<ActionProps>[];
    version?: number;
    readonly?: boolean;
    selectedIds?: number[];
    editOnNewPage?: boolean;
    queryIntersects?: string;
    params?: string;
    cleanSelectedOnFilter?: boolean;
    beforeDelete?: (featureIds: number[]) => void;
    deleteError?: (featureIds: number[]) => void;
    onSelect?: (selected: number[]) => void;
    onDelete?: (featureIds: number[]) => void;
    onSave?: (value: ResourceItem | undefined) => void;
}

const msgSettingsTitle = gettext("Open table settings");
const msgRefreshTitle = gettext("Refresh table");

const loadingCol = () => "...";

export const FeatureGrid = ({
    id,
    size = "middle",
    query: propQuery,
    actions: propActions = [],
    version: propVersion,
    readonly = true,
    selectedIds,
    editOnNewPage,
    queryIntersects,
    params,
    cleanSelectedOnFilter = true,
    beforeDelete,
    deleteError,
    onDelete,
    onSelect,
    onSave,
}: FeatureGridProps) => {
    const { data: totalData, refresh: refreshTotal } =
        useRouteGet<FeatureLayerCount>("feature_layer.feature.count", {
            id,
        });
    const { data: resourceData } = useRouteGet<ResourceItem>("resource.item", {
        id,
    });

    const [query, setQuery] = useState("");
    const [version, bumpVersion] = useReducer(
        (state) => state + 1,
        propVersion || 0
    );
    const [selected, setSelected] = useState<FeatureAttrs[]>(() => []);
    const [settingsOpen, setSettingsOpen] = useState(false);

    const fields = useMemo(() => {
        if (resourceData) {
            return resourceData.feature_layer?.fields;
        }
        return undefined;
    }, [resourceData]);

    const [visibleFields, setVisibleFields] = useState<number[]>(() => [
        KEY_FIELD_ID,
    ]);

    useEffect(() => {
        if (propVersion !== undefined) {
            bumpVersion();
        }
    }, [propVersion]);

    useEffect(() => {
        if (selectedIds) {
            setSelected(selectedIds.map((s) => ({ [KEY_FIELD_KEYNAME]: s })));
        }
    }, [selectedIds, setSelected]);

    const prevSelectedIds = useRef(selectedIds);
    useEffect(() => {
        if (onSelect) {
            const selectedIds_ = selected.map((s) =>
                Number(s[KEY_FIELD_KEYNAME])
            );
            if (!isEqual(selectedIds_, prevSelectedIds.current)) {
                prevSelectedIds.current = selectedIds_;
                onSelect(selectedIds_ || []);
            }
        }
    }, [onSelect, selected]);

    useEffect(() => {
        if (propQuery !== undefined) {
            setQuery(propQuery);
        }
    }, [propQuery]);

    useEffect(() => {
        if (fields) {
            setVisibleFields([
                KEY_FIELD_ID,
                ...fields.filter((f) => f.grid_visibility).map((f) => f.id),
            ]);
        }
    }, [fields]);

    if (!totalData || !fields) {
        return <LoadingWrapper />;
    }

    return (
        <div className="ngw-feature-layer-feature-grid">
            <FeatureGridActions
                id={id}
                size={size}
                query={query}
                actions={propActions}
                readonly={readonly}
                selected={selected}
                editOnNewPage={editOnNewPage}
                beforeDelete={beforeDelete}
                refreshTotal={refreshTotal}
                deleteError={deleteError}
                setSelected={setSelected}
                onDelete={onDelete}
                setQuery={setQuery}
                onSave={(val) => {
                    onSave && onSave(val);
                    bumpVersion();
                }}
            >
                <div>
                    <Tooltip title={msgRefreshTitle}>
                        <Button
                            type="text"
                            icon={<RefreshIcon />}
                            onClick={bumpVersion}
                            size={size}
                        />
                    </Tooltip>
                    <Tooltip title={msgSettingsTitle}>
                        <Button
                            type="text"
                            icon={<TuneIcon />}
                            onClick={() => {
                                setSettingsOpen(!settingsOpen);
                            }}
                            size={size}
                        />
                    </Tooltip>
                </div>
            </FeatureGridActions>

            <FeatureTable
                empty={() => <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />}
                total={totalData.total_count}
                query={query}
                fields={fields}
                version={version}
                selected={selected}
                resourceId={id}
                visibleFields={visibleFields}
                queryIntersects={queryIntersects}
                params={params}
                cleanSelectedOnFilter={cleanSelectedOnFilter}
                setSelected={setSelected}
                loadingCol={loadingCol}
            />

            <TableConfigModal
                fields={fields}
                isOpen={settingsOpen}
                setIsOpen={setSettingsOpen}
                visibleFields={visibleFields}
                setVisibleFields={setVisibleFields}
            />
        </div>
    );
};
