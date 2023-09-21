from nextgisweb.env import _
from nextgisweb.lib.registry import dict_registry


@dict_registry
class WebMapAdapter:
    """Web map adapter is responsible for how layer style
    will be displayed on web map.

    It consists of two parts. First works on the server and implemented as
    a python-class, second works on fronend and implemented as an AMD module."""

    identity: str = None
    display_name: str = None
    mid: str = None


class TileAdapter(WebMapAdapter):
    """An adapter that implements visulation of layer style through
    tile service, but the service itself is implemented by other component."""

    identity = "tile"
    mid = "ngw-webmap/TileAdapter"
    display_name = _("Tiles")


class ImageAdapter(WebMapAdapter):
    """An adapter that implements visulation of layer style through
    WMS-like GetImage request, but the service itself is implemented by other component."""

    identity = "image"
    mid = "ngw-webmap/ImageAdapter"
    display_name = _("Image")
