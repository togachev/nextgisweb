import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useObjectState } from "@nextgisweb/gui/hook";
import { createToggleControl } from "@nextgisweb/webmap/ol/control/createToggleControl";
import type {
    ToggleControl as IToggleControl,
    ToggleControlOptions,
} from "@nextgisweb/webmap/ol/control/createToggleControl";

import { useMapContext } from "../context/useMapContext";
import { useMapControl } from "../hook/useMapControl";

import type { ControlProps } from "./MapControl";

export type ToggleControlProps = Omit<
    ControlProps<ToggleControlOptions>,
    "html"
> & {
    children?: ReactNode;
    render?: (status: boolean) => ReactNode;
};

export function ToggleControl({
    position,
    children,
    render,
    status: statusProp,
    style,
    ...toggleOptions
}: ToggleControlProps) {
    const statusRef = useRef(statusProp);

    const [options] = useObjectState(toggleOptions);
    const context = useMapContext();
    const [instance, setInstance] = useState<IToggleControl>();
    const [status, setStatus] = useState(statusProp ?? false);

    useMapControl({ context, instance, position });

    const portal = useRef(document.createElement("div"));

    const createControl = useCallback(() => {
        return createToggleControl({
            ...options,
            status: statusRef.current,
            html: portal.current,
            onClick: async (newStatus) => {
                setStatus(newStatus);
                if (options.onClick) {
                    await options.onClick(newStatus);
                }
            },
        });
    }, [options]);

    useEffect(() => {
        const control = createControl();
        setInstance(control);

        return () => {
            control.setMap(null);
        };
    }, [createControl]);

    useEffect(() => {
        statusRef.current = status;
        if (!instance) return;
        instance.changeStatus(status);
    }, [instance, status]);

    useEffect(() => {
        if (!instance) return;

        instance.setStyle(style);
    }, [instance, style]);

    const content = useMemo(() => {
        if (render) {
            return render(status);
        }
        return children;
    }, [render, children, status]);

    return createPortal(content, portal.current);
}
