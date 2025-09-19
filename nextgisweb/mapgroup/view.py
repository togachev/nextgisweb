from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget
from nextgisweb.webmap import WebMap

from .model import Mapgroup


class MapgroupGroupWidget(Widget):
    resource = Mapgroup
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/group-widget")


class MapgroupWebMapWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/webmap-widget")
