import { uniq } from "lodash-es";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";

import { Divider, InputNumber, Select } from "@nextgisweb/gui/antd";
import { LotMV } from "@nextgisweb/gui/arm";
import { AutoCompleteInput } from "@nextgisweb/gui/component";
import { Area } from "@nextgisweb/gui/mayout";
import { route } from "@nextgisweb/pyramid/api";
import { useCache } from "@nextgisweb/pyramid/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ResourceSelectRef } from "@nextgisweb/resource/component";
import type {
    EditorWidgetComponent,
    EditorWidgetProps,
} from "@nextgisweb/resource/type";

import type { LayerStore } from "./LayerStore";

const msgConnection = gettext("Connection");
const msgSchema = gettext("Schema");
const msgTable = gettext("Table");
const msgColumnId = gettext("ID column");

const msgResRelSettings = gettext("Resource relation settings");
const msgFieldforConnectionWithExternalTable = gettext("Field for connection with external table");
const msgExternalTableField = gettext("External table field");
const msgJoiningWithAnExternalTable = gettext("Joining with an external table");

const msgColumnGeom = gettext("Geometry column");
const msgAutodetect = gettext("Autodetect");
const msgGeometryType = gettext("Geometry type");
const msgSrid = gettext("SRID");
const msgFields = gettext("Fields");

async function inspConFetch([conId]: [number], opts: { signal: AbortSignal }) {
    const data = await route("postgis.connection.inspect", conId).get({
        signal: opts.signal,
    });
    return data
        .map(({ schema, tables, views }) =>
            [...tables, ...views].map((table) => ({
                schema,
                table,
            }))
        )
        .flat();
}

async function inspTabFetch(
    [conId, schema, table]: [number, string, string],
    opts: { signal: AbortSignal }
) {
    const data = await route("postgis.connection.inspect.table", {
        id: conId,
        table_name: table,
    }).get({ query: { schema }, signal: opts.signal });
    const result = { id: new Array<string>(), geom: new Array<string>() };
    for (const { name, type } of data) {
        if (/^INTEGER|BIGINT$/i.test(type)) result.id.push(name);
        if (/^GEOMETRY\(/i.test(type)) result.geom.push(name);
    }
    return result;
}

async function relFieldFetch([extResId]: [number], opts: { signal: AbortSignal }) {
    const fields = await route("feature_layer.fields", extResId).get({
        signal: opts.signal,
    });
    const result = { fields: new Array<string>() };
    fields.map(item => {
        if (/^INTEGER|BIGINT$/i.test(item.datatype)) result.fields.push(item.keyname);
    })
    return result;
}

type FocusedField = "schema" | "table" | "columnId" | "resourceFieldName" | "externalFieldName" | "columnGeom" | null;
const conFields: FocusedField[] = ["schema", "table"];
const tabFields: FocusedField[] = ["columnId", "columnGeom", "resourceFieldName"];
const relFields: FocusedField[] = ["externalFieldName"];

const SKIPPED = { status: "skipped" as const };
type OrSkipped<V extends (...args: never[]) => unknown> =
    | ReturnType<V>
    | typeof SKIPPED;

const geometryTypeOptions = [
    { value: "POINT", label: gettext("Point") },
    { value: "LINESTRING", label: gettext("Line") },
    { value: "POLYGON", label: gettext("Polygon") },
    { value: "MULTIPOINT", label: gettext("Multipoint") },
    { value: "MULTILINESTRING", label: gettext("Multiline") },
    { value: "MULTIPOLYGON", label: gettext("Multipolygon") },
    { value: "POINTZ", label: gettext("Point Z") },
    { value: "LINESTRINGZ", label: gettext("Line Z") },
    { value: "POLYGONZ", label: gettext("Polygon Z") },
    { value: "MULTIPOINTZ", label: gettext("Multipoint Z") },
    { value: "MULTILINESTRINGZ", label: gettext("Multiline Z") },
    { value: "MULTIPOLYGONZ", label: gettext("Multipolygon Z") },
];

const fieldsOptions = [
    { value: "keep", label: gettext("Keep existing definitions untouched") },
    { value: "update", label: gettext("Update definitions from the database") },
];

export const LayerWidget: EditorWidgetComponent<EditorWidgetProps<LayerStore>> =
    observer(({ store }: EditorWidgetProps<LayerStore>) => {
        const [focusedField, setFocusedField] = useState<FocusedField>(null);

        const inspCon = useCache(inspConFetch);
        const inspTab = useCache(inspTabFetch);
        const resFieldRel = useCache(relFieldFetch);

        const conId = store.connection.value?.id;
        const schema = store.schema.value;
        const table = store.table.value;
        const extResId = store.connection_relation.value?.id;

        let conInfo: OrSkipped<typeof inspCon> = SKIPPED;
        if (conId) {
            // Do not inspect connection util schema or table focused
            const cachedOnly = !conFields.includes(focusedField!);
            conInfo = inspCon([conId], { cachedOnly });
        }

        let tabInfo: OrSkipped<typeof inspTab> = SKIPPED;
        if (conId && schema && table) {
            // Do not inspect table util id or geom column focused
            const cachedOnly = !tabFields.includes(focusedField!);
            tabInfo = inspTab([conId, schema, table], { cachedOnly });
        }

        let relFieldInfo: OrSkipped<typeof resFieldRel> = SKIPPED;
        if (extResId) {
            // Do not inspect connection util schema or table focused
            const cachedOnly = !relFields.includes(focusedField!);
            relFieldInfo = resFieldRel([extResId], { cachedOnly });
        }

        const schemaOpts = useMemo(() => {
            if (conInfo?.status !== "ready") return undefined;
            const schemas = uniq(conInfo.data.map((i) => i.schema));
            return schemas.map((i) => ({ label: i, value: i }));
        }, [conInfo]);

        const tableOpts = useMemo(() => {
            if (conInfo?.status !== "ready") return undefined;
            const tables = conInfo.data
                .filter((i) => i.schema === schema)
                .map((i) => i.table);
            return tables.map((i) => ({ label: i, value: i }));
        }, [schema, conInfo]);

        const columnIdOpts = useMemo(() => {
            if (tabInfo?.status !== "ready") return undefined;
            return tabInfo.data.id.map((n) => ({ value: n, label: n }));
        }, [tabInfo]);

        const resourceFieldNameOpts = useMemo(() => {
            if (tabInfo?.status !== "ready") return undefined;
            return tabInfo.data.id.map((n) => ({ value: n, label: n }));
        }, [tabInfo]);

        const columnGeomOpts = useMemo(() => {
            if (tabInfo?.status !== "ready") return undefined;
            return tabInfo.data.geom.map((n) => ({ value: n, label: n }));
        }, [tabInfo]);

        const externalFieldNameOpts = useMemo(() => {
            if (relFieldInfo?.status !== "ready") return undefined;
            return relFieldInfo.data.fields.map((n) => ({ value: n, label: n }));
        }, [relFieldInfo]);

        const acProps = useCallback(
            (
                field: NonNullable<FocusedField>,
                { status }: { status: unknown | "skipped" },
                options: { label: string; value: string }[] | undefined
            ) => ({
                onFocus: () => setFocusedField(field),
                onBlur: () => setFocusedField(null),
                loading: status === "loading" && focusedField === field,
                style: { width: "100%" },
                options,
            }),
            [focusedField]
        );

        const resourceFieldNameProps = acProps("resourceFieldName", tabInfo, resourceFieldNameOpts);
        Object.assign(resourceFieldNameProps, { allowClear: true, });

        const externalFieldNameProps = acProps("externalFieldName", relFieldInfo, externalFieldNameOpts);
        Object.assign(externalFieldNameProps, { allowClear: true, });

        return (
            <>
                <Area pad cols={["1fr", "1fr"]}>
                    <LotMV
                        row
                        label={msgConnection}
                        value={store.connection}
                        component={ResourceSelectRef}
                        props={{
                            pickerOptions: {
                                requireClass: "postgis_connection",
                                initParentId: store.composite.parent,
                            },
                            style: { width: "100%" },
                        }}
                    />
                    <LotMV
                        label={msgSchema}
                        value={store.schema}
                        component={AutoCompleteInput}
                        props={acProps("schema", conInfo, schemaOpts)}
                    />
                    <LotMV
                        label={msgTable}
                        value={store.table}
                        component={AutoCompleteInput}
                        props={acProps("table", conInfo, tableOpts)}
                    />
                    <LotMV
                        label={msgColumnId}
                        value={store.columnId}
                        component={AutoCompleteInput}
                        props={acProps("columnId", tabInfo, columnIdOpts)}
                    />
                    <LotMV
                        label={msgColumnGeom}
                        value={store.columnGeom}
                        component={AutoCompleteInput}
                        props={acProps("columnGeom", tabInfo, columnGeomOpts)}
                    />
                    <LotMV
                        label={msgGeometryType}
                        value={store.geometryType}
                        component={Select}
                        props={{
                            options: geometryTypeOptions,
                            allowClear: true,
                            placeholder: msgAutodetect,
                            style: { width: "100%" },
                        }}
                    />
                    <LotMV
                        label={msgSrid}
                        value={store.geometrySrid}
                        component={InputNumber}
                        props={{
                            ...{ min: 1, max: 998999, controls: false },
                            placeholder: msgAutodetect,
                            style: { width: "100%" },
                        }}
                    />
                    <LotMV
                        row
                        label={msgFields}
                        value={store.fields}
                        component={Select}
                        props={{
                            options: fieldsOptions,
                            style: { width: "100%" },
                        }}
                    />
                </Area>
                <Divider orientation="left" orientationMargin="16" plain>{msgResRelSettings}</Divider>
                <Area pad cols={["1fr", "1fr"]}>
                    <LotMV
                        row
                        label={msgJoiningWithAnExternalTable}
                        value={store.connection_relation}
                        component={ResourceSelectRef}
                        props={{
                            pickerOptions: { requireClass: "tablenogeom_layer" },
                            style: { width: "100%" },
                            allowClear: true,
                        }}
                    />
                    <LotMV
                        label={msgFieldforConnectionWithExternalTable}
                        value={store.resourceFieldName}
                        component={AutoCompleteInput}
                        props={resourceFieldNameProps}
                    />
                    <LotMV
                        label={msgExternalTableField}
                        value={store.externalFieldName}
                        component={AutoCompleteInput}
                        props={externalFieldNameProps}
                    />
                </Area>
            </>
        );
    });

LayerWidget.displayName = "LayerWidget";
LayerWidget.title = gettext("PostGIS layer");
LayerWidget.activateOn = { create: true };
LayerWidget.order = -50;