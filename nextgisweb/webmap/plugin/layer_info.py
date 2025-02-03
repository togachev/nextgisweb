from .base import WebmapLayerPlugin


class LayerInfoPlugin(WebmapLayerPlugin):
    amd_free = True

    @classmethod
    def is_layer_supported(cls, *, style, layer, webmap):
        payload = dict()

        if style.description is not None and layer.description is None:
            payload["description_style"] = style.description
        elif style.description is None and layer.description is not None:
            payload["description_layer"] = layer.description
        elif style.description is not None and layer.description is not None:
            payload["description_style"] = style.description
            payload["description_layer"] = layer.description

        return ("@nextgisweb/webmap/plugin/layer-info", payload)
