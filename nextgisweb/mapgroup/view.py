from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget
from nextgisweb.webmap import WebMap

from .model import MapgroupResource


class MapgroupResourceWidget(Widget):
    resource = MapgroupResource
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/group-widget")