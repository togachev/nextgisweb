import { useMemo, useState } from "react";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { LoadingWrapper } from "@nextgisweb/gui/component";
import { Checkbox } from "@nextgisweb/gui/antd";
import { Code } from "@nextgisweb/gui/component/code";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import type { CheckboxProps } from "@nextgisweb/gui/antd";

interface JsonViewProps {
    id: number;
}

export function JsonView({ id }: JsonViewProps) {
    const [checked, setChecked] = useState(false);
    const { data, isLoading } = useRouteGet(
        "resource.item",
        { id },
        { cache: true, query: { description: checked } },
    );

    const body = useMemo(() => {
        return JSON.stringify(data, null, 2);
    }, [data]);

    if (isLoading) {
        return <LoadingWrapper />;
    }

    const onChange: CheckboxProps["onChange"] = (e) => {
        setChecked(e.target.checked);
    };

    return (<>
        {data && data.resource.description_status &&
            <Checkbox checked={checked} onChange={onChange}>
                {checked ?
                    gettext("Disable view description") :
                    gettext("Enable view description")
                }
            </Checkbox>
        }
        <Code value={body} lang="json" readOnly lineNumbers></Code>
    </>);
}
