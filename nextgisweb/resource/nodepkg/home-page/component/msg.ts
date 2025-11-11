import { gettext } from "@nextgisweb/pyramid/i18n";

export const msgEmty = (key: string) => {
    const obj: any = {
        map: gettext("Create or add a web map to the current group"),
        group: gettext("Create a new group"),
    }

    return obj[key]
}