import { uniq } from "lodash-es";
import { observer } from "mobx-react-lite";
import { useCallback, useMemo, useState } from "react";

import { Select } from "@nextgisweb/gui/antd";
import { LotMV } from "@nextgisweb/gui/arm";
import { AutoCompleteInput } from "@nextgisweb/gui/component";
import { Area } from "@nextgisweb/gui/mayout";
import { route } from "@nextgisweb/pyramid/api";
import { useCache } from "@nextgisweb/pyramid/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { ResourceSelectRef } from "@nextgisweb/resource/component";
import type { EditorWidget } from "@nextgisweb/resource/type";

import type { LayerStore } from "./LayerStore";

const msgConnection = gettext("Connection");
const msgSchema = gettext("Schema");
const msgTable = gettext("Table");
const msgColumnId = gettext("ID column");
const msgFields = gettext("Fields");

async function inspConFetch([conId]: [number], opts: { signal: AbortSignal }) {
    const data = await route("tablenogeom.connection.inspect_tablenogeom", conId).get({
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
    const data = await route("tablenogeom.connection.inspect_tablenogeom.table", {
        id: conId,
        table_name: table,
    }).get({ query: { schema }, signal: opts.signal });
    const result = { id: new Array<string>(), geom: new Array<string>() };
    for (const { name, type } of data) {
        if (/^INTEGER|BIGINT$/i.test(type)) result.id.push(name);
    }
    return result;
}

type FocusedField = "schema" | "table" | "columnId" | null;
const conFields: FocusedField[] = ["schema", "table"];
const tabFields: FocusedField[] = ["columnId"];

const SKIPPED = { status: "skipped" as const };
type OrSkipped<V extends (...args: never[]) => unknown> =
    | ReturnType<V>
    | typeof SKIPPED;

const fieldsOptions = [
    { value: "keep", label: gettext("Keep existing definitions untouched") },
    { value: "update", label: gettext("Update definitions from the database") },
];

export const LayerWidget: EditorWidget<LayerStore> = observer(({ store }) => {
    const [focusedField, setFocusedField] = useState<FocusedField>(null);

    const inspCon = useCache(inspConFetch);
    const inspTab = useCache(inspTabFetch);

    const conId = store.connection.value?.id;
    const schema = store.schema.value;
    const table = store.table.value;

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

    return (
        <Area pad cols={["1fr", "1fr"]}>
            <LotMV
                row
                label={msgConnection}
                value={store.connection}
                component={ResourceSelectRef}
                props={{
                    pickerOptions: {
                        requireClass: "tablenogeom_connection",
                        initParentId: store.composite.parent,
                        clsFilter: "tablenogeom_service",
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
    );
});

LayerWidget.displayName = "LayerWidget";
LayerWidget.title = gettext("Tablenogeom layer");
LayerWidget.activateOn = { create: true };
LayerWidget.order = -50;