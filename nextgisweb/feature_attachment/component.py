import transaction

from nextgisweb.env import Component, _, require

from nextgisweb.core import KindOfData

from .model import FeatureAttachment


class FeatureAttachmentData(KindOfData):
    identity = "feature_attachment"
    display_name = _("Feature attachments")


class FeatureAttachmentComponent(Component):
    @require("feature_layer")
    def initialize(self):
        from . import extension  # noqa: F401

    def setup_pyramid(self, config):
        from . import api, view

        api.setup_pyramid(self, config)
        view.setup_pyramid(self, config)

    def maintenance(self):
        with transaction.manager:
            for obj in FeatureAttachment.filter_by(file_meta=None):
                obj.extract_meta()

    def estimate_storage(self):
        for obj in FeatureAttachment.query():
            yield FeatureAttachmentData, obj.resource_id, obj.size
