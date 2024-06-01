/** @entrypoint */
import "@nextgisweb/jsrealm/shared-icon";

export function html({
    collection,
    glyph,
    variant,
}: {
    collection?: string;
    glyph: string;
    variant?: "baseline" | string;
}) {
    const id =
        `icon-${collection || "material"}-${glyph}` +
        (variant && variant !== "baseline" ? `-${variant}` : "");
    return `<svg class="icon" fill="currentColor"><use xlink:href="#${id}"/></svg>`;
}
