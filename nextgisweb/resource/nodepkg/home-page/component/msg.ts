import { gettext } from "@nextgisweb/pyramid/i18n";

export const msg = (type: string, operation: string) => {
    const obj: any = {
        group: {
            create: gettext("Create a group"),
            update: gettext("Group settings"),
        },
        map: {
            update: gettext("Configuring a web map in a group"),
        }
    }

    return obj[type][operation]
}