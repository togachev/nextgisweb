from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget
from nextgisweb.webmap import WebMap
from nextgisweb.mapgroup import MapgroupResource

class MapgroupResourceWidget(Widget):
    resource = MapgroupResource
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/mapgroup-widget")


class MapgroupWebMapWidget(Widget):
    resource = WebMap
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/webmap-widget")