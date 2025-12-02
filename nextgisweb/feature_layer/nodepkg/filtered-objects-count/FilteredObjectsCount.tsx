import { observer } from "mobx-react-lite";
import { useMemo } from "react";

import { Tooltip } from "@nextgisweb/gui/antd";
import { useRouteGet } from "@nextgisweb/pyramid/hook/useRouteGet";
import { gettext, gettextf } from "@nextgisweb/pyramid/i18n";

import type { FeatureGridStore } from "../feature-grid/FeatureGridStore";

import TagIcon from "@nextgisweb/icon/material/tag";

const buildCountQuery = (
    queryParams: FeatureGridStore["queryParams"],
    filterExpression: FeatureGridStore["filterExpression"]
) => {
    const query: {
        filter?: string;
        like?: string;
        ilike?: string;
        intersects?: string;
    } = {};

    if (filterExpression) {
        query.filter = filterExpression;
    }

    if (queryParams) {
        if (queryParams.like) query.like = queryParams.like;
        if (queryParams.ilike) query.ilike = queryParams.ilike;
        if (queryParams.intersects) query.intersects = queryParams.intersects;
    }

    return Object.keys(query).length > 0 ? query : undefined;
};

interface FilteredCountExpandedProps {
    store: FeatureGridStore;
    handleToggle: () => void;
}

const FilteredCountExpanded = observer(
    ({ store }: FilteredCountExpandedProps) => {
        const { id, queryParams, filterExpression, version } = store;

        const countQuery = useMemo(
            () => buildCountQuery(queryParams, filterExpression),
            [queryParams, filterExpression]
        );

        const options = useMemo(() => {
            return countQuery ? { query: countQuery, version } : { version };
        }, [countQuery, version]);

        const { data: countData } = useRouteGet(
            "feature_layer.feature.count",
            { id },
            options,
            false
        );

        let displayText = undefined;
        if (countData) {
            const { total_count, filtered_count } = countData;
            displayText =
                filtered_count !== undefined
                    ? gettextf("{filtered_count} of {total_count}")({
                        filtered_count,
                        total_count,
                    })
                    : `${total_count}`;
        }

        return (
            <span style={{ fontWeight: "bold" }}>
                <Tooltip title={gettext("Feature count")}>
                    <TagIcon />
                    {displayText}
                </Tooltip>
            </span>
        );
    }
);

FilteredCountExpanded.displayName = "FilteredCountExpanded";

interface FilteredCountProps {
    store: FeatureGridStore;
}

const FilteredObjectsCount = observer(({ store }: FilteredCountProps) => {
    return <FilteredCountExpanded store={store} />;
});

FilteredObjectsCount.displayName = "FilteredObjectsCount";

export default FilteredObjectsCount;
