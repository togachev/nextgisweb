import { Image } from "antd";
import parse, { domToReact } from "html-react-parser";
import type {
    DOMNode,
    Element,
    HTMLReactParserOptions,
} from "html-react-parser";
import { FC, MouseEvent } from "react";

type ChildNode = DOMNode["nextSibling"] & DOMNode["previousSibling"];

const isHollowText = (el: ChildNode): boolean => {
    if (el?.type !== "text") return false;
    return el.data.replace(/\n/g, "").trim() === "";
};

const isAdjacentToNonHollowText = (el: Element): boolean => {
    if (el.name !== "img") return false;

    const { nextSibling, previousSibling } = el;
    return (
        (nextSibling?.type === "text" && !isHollowText(nextSibling)) ||
        (previousSibling?.type === "text" && !isHollowText(previousSibling))
    );
};

interface ProcessedHtmlProps {
    htmlString: string;
    onLinkClick?: ((e: MouseEvent<HTMLAnchorElement>) => boolean) | null;
}

export const ProcessedHtml: FC<ProcessedHtmlProps> = ({
    htmlString,
    onLinkClick,
}) => {
    const options: HTMLReactParserOptions = {
        replace: (node: DOMNode) => {
            if (node.type === "tag") {
                const el = node;

                if (el.name === "img") {
                    const { src, alt, width, height } = el.attribs;

                    if (isAdjacentToNonHollowText(el)) {
                        return (
                            <img
                                src={src}
                                alt={alt}
                                width={`${width}px`}
                                height={`${height}px`}
                            />
                        );
                    } else {
                        return (
                            <Image
                                src={src}
                                alt={alt}
                                width={`${width}px`}
                                height={`${height}px`}
                            />
                        );
                    }
                }

                // Ckeditor 5 automatically changes the html structure in Source
                // editing mode. Automatically add the p tag surrounding the
                // child tags. So we have to normalize the HTML structure to
                // work with Antd Image component. Otherwise CKEditor changes
                // will cause errors in console.
                const isParagraphInFigure =
                    el.name === "figure" &&
                    el.firstChild &&
                    el.firstChild.type === "tag" &&
                    el.firstChild.name === "p";

                if (isParagraphInFigure) {
                    return (
                        <figure>
                            {domToReact(
                                el.firstChild.children as DOMNode[],
                                options
                            )}
                        </figure>
                    );
                }

                if (el.name === "a" && el.attribs?.href) {
                    const href = el.attribs.href;
                    const target = el.attribs.target;
                    return (
                        <a
                            href={href}
                            target={target}
                            onClick={(e) => {
                                if (onLinkClick) {
                                    if (onLinkClick(e)) {
                                        e.preventDefault();
                                    }
                                }
                            }}
                        >
                            {/* Why ws should use `as` here – https://github.com/remarkablemark/html-react-parser/issues/1126#issuecomment-1784188447 */}
                            {domToReact(el.children as DOMNode[], options)}
                        </a>
                    );
                }
            }

            return undefined;
        },
    };
    return <>{parse(htmlString, options)}</>;
};
