import classNames from "classnames";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { ConfigProvider, Tooltip } from "@nextgisweb/gui/antd";

interface PageTitleProps {
    title?: string;
    pullRight?: boolean;
    children: ReactNode[] | ReactNode;
}

export function PageTitle({ title, pullRight, children }: PageTitleProps) {
    const titleRef = useRef<HTMLElement | null>();

    const ititle = useMemo(() => {
        // Capture an existing page title if not set
        titleRef.current = document.getElementById("title");
        return title || titleRef.current?.innerText;
    }, [title]);

    useLayoutEffect(() => {
        // Delete existing header if it isn't replaced
        titleRef.current?.remove();
    }, []);

    return (
        <ConfigProvider
            theme={{
                components: {
                    Tooltip: {
                        colorBgSpotlight: "var(--on-primary-text)",
                        colorTextLightSolid: "var(--text-base)",
                    },
                },
            }}>
            <h1
                className={classNames("ngw-pyramid-layout-title", {
                    "pull-right": pullRight,
                })}
            >
                <Tooltip style={{ pointerEvents: "none" }} title={ititle}>
                    <div title={ititle} className="title-class">{ititle}</div>
                </Tooltip>
                {children}
            </h1>
        </ConfigProvider>
    );
}