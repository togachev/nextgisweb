from nextgisweb.jsrealm import jsentry
from nextgisweb.resource import Widget
from nextgisweb.mapgroup import MapgroupResource


class MapgroupResourceWidget(Widget):
    resource = MapgroupResource
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/mapgroup-widget")


class MapgroupGroupWidget(Widget):
    resource = MapgroupResource
    operation = ("create", "update")
    amdmod = jsentry("@nextgisweb/mapgroup/group-widget")


