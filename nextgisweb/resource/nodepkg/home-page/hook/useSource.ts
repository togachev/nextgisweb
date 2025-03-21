import { route } from "@nextgisweb/pyramid/api";

export const useSource = () => {

    const getPermission = async (id) => {
        const value = await route("resource.permission", id).get();
        return value;
    }

    return { getPermission };
};
