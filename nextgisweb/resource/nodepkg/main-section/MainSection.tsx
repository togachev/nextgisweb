import { Fragment } from "react";
import { Divider, Flex, Tag } from "@nextgisweb/gui/antd";
import { PageTitle } from "@nextgisweb/pyramid/layout";
import type { ResourceCls } from "@nextgisweb/resource/type/api";
import { gettext } from "@nextgisweb/pyramid/i18n";
import { CreateResourceButton } from "./CreateResourceButton";

import "./MainSection.less";

interface MainSectionProps {
    resourceId: number;
    summary: [string, string][];
    groupMap: string[];
    creatable?: ResourceCls[];
}

export function MainSection({
    resourceId,
    groupMap,
    summary,
    creatable,
}: MainSectionProps) {
    return (
        <>
            <PageTitle pullRight>
                {creatable && creatable.length > 0 && (
                    <CreateResourceButton
                        resourceId={resourceId}
                        creatable={creatable}
                    />
                )}
            </PageTitle>
            {summary.length > 0 && (
                <dl className="ngw-resource-main-section-summary">
                    {summary.map(([k, v], idx) => (
                        <Fragment key={idx}>
                            <dt>{k}</dt>
                            <dd>{v}</dd>
                        </Fragment>
                    ))}
                </dl>
            )}
            <Divider orientation="left" orientationMargin="0">{gettext("Web map group")}</Divider>
            {groupMap.length > 0 && (
                <Flex gap="4px 0" wrap>
                    {groupMap.map((k, idx) => (
                        <Tag key={idx}>{k}</Tag>
                    ))}
                </Flex>
            )}
        </>
    );
}
