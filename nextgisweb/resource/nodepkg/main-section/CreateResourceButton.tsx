import { Suspense, lazy, useCallback, useState } from "react";

import { Button } from "@nextgisweb/gui/antd";
import { AddIcon } from "@nextgisweb/gui/icon";
import { gettext } from "@nextgisweb/pyramid/i18n";

const msgCreateResource = gettext("Create resource");

const LazyModal = lazy(() => import("./CreateResourceModal"));

interface CreateResourceButtonProps {
    resourceId: number;
    creatable: string[];
}

export function CreateResourceButton({
    resourceId,
    creatable,
}: CreateResourceButtonProps) {
    const [modalOpen, setModalOpen] = useState(false);
    const [modalWasOpen, setModalWasOpen] = useState(false);

    const showModal = useCallback(() => {
        setModalOpen(true);
        setModalWasOpen(true);
    }, []);

    const hideModal = useCallback(() => {
        setModalOpen(false);
        setModalWasOpen(false);
    }, []);

    return (
        <>
            <Button
                type="primary"
                size="middle"
                icon={<AddIcon />}
                onClick={showModal}
            >
                {msgCreateResource}
            </Button>
            {modalWasOpen && (
                <Suspense>
                    <LazyModal
                        resourceId={resourceId}
                        creatable={creatable}
                        open={modalOpen}
                        onCancel={hideModal}
                    />
                </Suspense>
            )}
        </>
    );
}
