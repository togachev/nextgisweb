from nextgisweb.env import Component, require


class FeatureDescriptionComponent(Component):
    identity = 'feature_description'

    @require('feature_layer')
    def initialize(self):
        from . import extension  # NOQA
