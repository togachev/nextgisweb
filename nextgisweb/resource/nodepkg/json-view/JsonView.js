import { useMemo } from "react";

import { LoadingWrapper } from "@nextgisweb/gui/component";
import { Code } from "@nextgisweb/gui/component/code";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";

import { updateObject } from "./updateObject";

export function JsonView(props) {
    const { data, isLoading } = useRouteGet(
        "resource.item",
        { id: props.id },
        { cache: true }
    );

    const body = useMemo(() => {
        return JSON.stringify(updateObject("password", '******', updateObject("username", '******', data)), null, 4);
    }, [data]);

    if (isLoading) {
        return <LoadingWrapper />;
    }
    return <Code value={body} lang="json" readOnly lineNumbers></Code>;
}
