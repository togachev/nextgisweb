import { isAbortError } from "@nextgisweb/gui/error";
import type { LoaderCache } from "@nextgisweb/pyramid/util/loader";

import { fetchFeatures } from "../api/fetchFeatures";
import type { UseFeatureTableProps } from "../hook/useFeatureTable";
import type { FeatureAttrs } from "../type";
import { updateFeaturesValue } from "../util/updateFeaturesValue";

interface FetchWrapperProps
    extends Pick<
        UseFeatureTableProps,
        "columns" | "pageSize" | "orderBy" | "resourceId" | "queryParams"
    > {
    page: number;
    signal: AbortSignal;
    key: string;
    cache: LoaderCache<FeatureAttrs[]>;
}

export function fetchWrapper({
    key,
    page,
    cache,
    signal,
    columns,
    orderBy,
    pageSize,
    resourceId,
    queryParams,
}: FetchWrapperProps) {
    if (!cache) {
        return [];
    }
    return cache
        .promiseFor(key, async () => {
            const features = await fetchFeatures({
                fields: columns
                    .filter((f) => f.keyname !== undefined)
                    .map((f) => f.keyname!),
                limit: pageSize,
                cache: false,
                offset: page,
                resourceId,
                orderBy,
                signal,
                ...queryParams,
            });
            return await updateFeaturesValue({
                resourceId: resourceId,
                data: features,
                signal,
            });
        })
        .catch((err) => {
            if (!isAbortError(err)) {
                throw err;
            }
        });
}
