import { observer } from "mobx-react-lite";
import { Suspense, lazy, useCallback } from "react";

import { useRouteGet } from "@nextgisweb/pyramid/hook";
import { gettext } from "@nextgisweb/pyramid/i18n";

import type { EditorWidget } from "../type";

import type { DescriptionEditorStore } from "./DescriptionEditorStore";

const TextEditor = lazy(() => import("@nextgisweb/gui/component/text-editor"));

export const DescriptionEditorWidget: EditorWidget<DescriptionEditorStore> =
    observer(({ store }) => {
        const id = store.composite.resourceId;

        const loadValue = useRouteGet(
            "resource.item",
            { id },
            {
                query: {
                    serialization: "resource",
                }
            }
        );

        const onChange = useCallback(
            (value: string) => {
                store.setValue(value);
            },
            [store]
        );

        return (
            <Suspense>
                <TextEditor
                    value={loadValue !== null ? loadValue.data?.resource.description : null}
                    onChange={onChange}
                    border={false}
                />
            </Suspense>
        )
    });

DescriptionEditorWidget.displayName = "DescriptionEditorWidget";
DescriptionEditorWidget.title = gettext("Description");
DescriptionEditorWidget.order = 80;
