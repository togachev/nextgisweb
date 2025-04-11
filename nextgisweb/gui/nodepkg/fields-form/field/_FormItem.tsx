import { isValidElement, useCallback, useMemo } from "react";
import type { ComponentType, ReactElement } from "react";

import { Form, Space, Row, Col } from "@nextgisweb/gui/antd";

import type { ChildProps, FormItemProps } from "../type";

export function FormItem({
    prepend,
    append,
    label,
    input: Input,
    noStyle = true,
    ...props
}: FormItemProps) {
    const memoizedInputComponent: ReactElement | null = useMemo(() => {
        if (isValidElement(Input)) {
            return Input;
        }
        if (typeof Input === "function" || typeof Input === "object") {
            const Component: ComponentType<ChildProps> =
                Input as ComponentType<ChildProps>;
            return <Component />;
        }
        return null;
    }, [Input]);

    const wrapWithSpaceIfNeeded = useCallback(
        (children: React.ReactNode) => {
            return prepend || append ? (
                <Space.Compact block>
                    {prepend}
                    {children}
                    {append}
                </Space.Compact>
            ) : (
                children
            );
        },
        [append, prepend]
    );

    return (
        <Row gutter={[16, 16]} wrap={false} style={{ alignItems: "center" }}>
            {label && (<Col xs={2} sm={4} md={6} lg={8} xl={10} style={{
                overflow: "hidden",
                letterSpacing: "normal",
                WebkitLineClamp: "2",
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                marginBottom: "24px",
            }} title={label}>{label}</Col>)}
            <Col flex="auto">
                <Form.Item>
                    {wrapWithSpaceIfNeeded(
                        <Form.Item {...props} noStyle={noStyle} >
                            {memoizedInputComponent}
                        </Form.Item >
                    )}
                </Form.Item>
            </Col>
        </Row >
    );
}
