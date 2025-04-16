from typing import TYPE_CHECKING, Literal

from osgeo import ogr
from typing_extensions import Annotated
from zope.interface import Attribute, Interface

from nextgisweb.jsrealm import TSExport
from nextgisweb.resource import IResourceBase

FIELD_TYPE_OGR = (
    ogr.OFTInteger,
    ogr.OFTInteger64,
    ogr.OFTReal,
    ogr.OFTString,
    ogr.OFTDate,
    ogr.OFTTime,
    ogr.OFTDateTime,
)

class FIELD_TYPE:
    INTEGER = "INTEGER"
    BIGINT = "BIGINT"
    REAL = "REAL"
    STRING = "STRING"
    DATE = "DATE"
    TIME = "TIME"
    DATETIME = "DATETIME"

    enum = (INTEGER, BIGINT, REAL, STRING, DATE, TIME, DATETIME)


if TYPE_CHECKING:
    FeatureLayerFieldDatatype = str
else:
    FeatureLayerFieldDatatype = Annotated[
        Literal[FIELD_TYPE.enum],
        TSExport("FeatureLayerFieldDatatype"),
    ]


class IFeatureLayerNoGeom(IResourceBase):
    fields = Attribute(""" List of fields """)

    feature_query = Attribute(""" Feature query class """)

    def field_by_keyname(self, keyname):
        """Get field by key. If field is not found,
        KeyError exception should be raised."""


class IFieldEditableFeatureLayer(IFeatureLayerNoGeom):
    """Feature layer that supports field editing"""

    def field_create(self, datatype):
        """Create and return a new field without appending to a layer"""

    def field_delete(self, field):
        """Remove field"""


class IWritableFeatureLayer(IFeatureLayerNoGeom):
    """Feature layer that supports writing"""

    def feature_create(self, feature):
        """Create new feature with description from feature

        :param feature: feature description
        :type feature:  dict

        :return:        ID of new feature
        """

    def feature_delete(self, feature_id):
        """Remove feature with id

        :param feature_id: feature id
        :type feature_id:  int or bigint
        """

    def feature_delete_all(self):
        """Remove all features"""

    def feature_put(self, feature):
        """Save feature in a layer"""


class IVersionableFeatureLayer(IWritableFeatureLayer):
    pass


class IFeatureQuery(Interface):
    layer = Attribute(""" IFeatureLayerNoGeom """)

    def fields(self, *args):
        """Set a list of request fields. If list of fields not set
        return all fields."""

    def limit(self, limit, offset=0):
        """Set request limit similarly to SQL
        LIMIT limit OFFSET offset"""


class IFeatureQueryFilter(IFeatureQuery):
    def filter(self, *args):
        """Set query rules"""


class IFeatureQueryFilterBy(IFeatureQuery):
    def filter_by(self, **kwargs):
        """Set query by attributes"""


class IFeatureQueryOrderBy(IFeatureQuery):
    def order_by(self, *args):
        """Set sort order"""


class IFeatureQueryLike(IFeatureQuery):
    def like(self, value):
        """Set query by substring"""


class IFeatureQueryIlike(IFeatureQuery):
    def ilike(self, value):
        """Set query by substring"""
