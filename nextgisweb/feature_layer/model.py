from osgeo import ogr
from sqlalchemy.ext.orderinglist import ordering_list
from sqlalchemy.orm import declared_attr

from nextgisweb.env import Base, _
from nextgisweb.lib import db
from nextgisweb.lib.geometry import Transformer

from nextgisweb.core.exception import ValidationError
from nextgisweb.lookup_table import LookupTable
from nextgisweb.resource import DataStructureScope, Resource, Serializer
from nextgisweb.resource import SerializedProperty as SP
from nextgisweb.spatial_ref_sys import SRS

from .interface import FIELD_TYPE, FIELD_TYPE_OGR

Base.depends_on("resource", "lookup_table")

FIELD_FORBIDDEN_NAME = ("fid", "geom")

_FIELD_TYPE_2_ENUM_REVERSED = dict(zip(FIELD_TYPE.enum, FIELD_TYPE_OGR))


class LayerField(Base):
    __tablename__ = "layer_field"

    id = db.Column(db.Integer, primary_key=True)
    layer_id = db.Column(db.ForeignKey(Resource.id), nullable=False)
    cls = db.Column(db.Unicode, nullable=False)

    idx = db.Column(db.Integer, nullable=False)
    keyname = db.Column(db.Unicode, nullable=False)
    datatype = db.Column(db.Enum(*FIELD_TYPE.enum), nullable=False)
    display_name = db.Column(db.Unicode, nullable=False)
    grid_visibility = db.Column(db.Boolean, nullable=False, default=True)
    text_search = db.Column(db.Boolean, nullable=False, default=True)
    lookup_table_id = db.Column(db.ForeignKey(LookupTable.id))

    identity = __tablename__

    __mapper_args__ = {"polymorphic_identity": identity, "polymorphic_on": cls}
    __table_args__ = (
        db.UniqueConstraint(layer_id, keyname, deferrable=True, initially="DEFERRED"),
        db.UniqueConstraint(layer_id, display_name, deferrable=True, initially="DEFERRED"),
    )

    layer = db.relationship(Resource, primaryjoin="Resource.id == LayerField.layer_id")

    lookup_table = db.relationship(
        LookupTable,
        primaryjoin="LayerField.lookup_table_id == LookupTable.id",
        backref=db.backref("layer_fields"),
    )

    def __str__(self):
        return self.display_name

    def to_dict(self):
        result = dict(
            (c, getattr(self, c))
            for c in (
                "id",
                "layer_id",
                "cls",
                "idx",
                "keyname",
                "datatype",
                "display_name",
                "grid_visibility",
                "text_search",
            )
        )
        if self.lookup_table is not None:
            result["lookup_table"] = dict(id=self.lookup_table.id)
        else:
            result["lookup_table"] = None
        return result


class LayerFieldsMixin:
    __field_class__ = LayerField
    __scope__ = DataStructureScope

    @declared_attr
    def fields(cls):
        return db.relationship(
            cls.__field_class__,
            foreign_keys=cls.__field_class__.layer_id,
            order_by=cls.__field_class__.idx,
            collection_class=ordering_list("idx"),
            cascade="all, delete-orphan",
            back_populates="layer",
            single_parent=True,
        )

    @declared_attr
    def feature_label_field_id(cls):
        return db.Column("feature_label_field_id", db.ForeignKey(cls.__field_class__.id))

    @declared_attr
    def feature_label_field(cls):
        return db.relationship(
            cls.__field_class__,
            uselist=False,
            primaryjoin="%s.id == %s.feature_label_field_id"
            % (cls.__field_class__.__name__, cls.__name__),
            cascade="all",
            post_update=True,
        )

    def to_ogr(self, ogr_ds, *, name="", fields=None, use_display_name=False, fid=None):
        if fields is None:
            fields = self.fields
        sr = self.srs.to_osr()
        ogr_layer = ogr_ds.CreateLayer(name, srs=sr)
        for field in fields:
            ogr_layer.CreateField(
                ogr.FieldDefn(
                    field.keyname if not use_display_name else field.display_name,
                    _FIELD_TYPE_2_ENUM_REVERSED[field.datatype],
                )
            )
        if fid is not None:
            ogr_layer.CreateField(ogr.FieldDefn(fid, ogr.OFTInteger))
        return ogr_layer


class _fields_attr(SP):
    def getter(self, srlzr):
        return [
            {
                "id": f.id,
                "keyname": f.keyname,
                "datatype": f.datatype,
                "typemod": None,
                "display_name": f.display_name,
                "label_field": f == srlzr.obj.feature_label_field,
                "grid_visibility": f.grid_visibility,
                "text_search": f.text_search,
                "lookup_table": (dict(id=f.lookup_table.id) if f.lookup_table else None),
            }
            for f in srlzr.obj.fields
        ]

    def setter(self, srlzr, value):
        obj = srlzr.obj

        fldmap = dict()
        for fld in obj.fields:
            fldmap[fld.id] = fld

        obj.feature_label_field = None

        new_fields = list()

        for fld in value:
            fldid = fld.get("id")

            if fldid is not None:
                try:
                    mfld = fldmap.pop(fldid)  # update
                except KeyError:
                    raise ValidationError(_("Field not found (ID=%d)." % fldid))

                if fld.get("delete", False):
                    obj.field_delete(mfld)  # delete
                    continue
            else:
                mfld = obj.field_create(fld["datatype"])  # create

            if "keyname" in fld:
                if fld["keyname"] in FIELD_FORBIDDEN_NAME:
                    raise ValidationError(
                        message=_(
                            "Field name is forbidden: '{}'. Please remove or " "rename it."
                        ).format(fld["keyname"])
                    )
                mfld.keyname = fld["keyname"]
            if "display_name" in fld:
                mfld.display_name = fld["display_name"]
            if "grid_visibility" in fld:
                mfld.grid_visibility = fld["grid_visibility"]
            if "text_search" in fld:
                mfld.text_search = fld["text_search"]
            if "lookup_table" in fld:
                # TODO: Handle errors: wrong schema, missing lookup table
                ltval = fld["lookup_table"]
                mfld.lookup_table = (
                    LookupTable.filter_by(id=ltval["id"]).one() if ltval is not None else None
                )

            if fld.get("label_field", False):
                obj.feature_label_field = mfld

            new_fields.append(mfld)

        # Keep not mentioned fields
        fields = list(fldmap.values())
        fields.extend(new_fields)

        # Check unique names
        fields_len = len(fields)
        for i in range(fields_len):
            keyname = fields[i].keyname
            display_name = fields[i].display_name
            for j in range(i + 1, fields_len):
                if keyname == fields[j].keyname:
                    raise ValidationError("Field keyname (%s) is not unique." % keyname)
                if display_name == fields[j].display_name:
                    raise ValidationError(
                        message="Field display_name (%s) is not unique." % display_name
                    )

        obj.fields = fields
        obj.fields.reorder()


P_DSS_READ = DataStructureScope.read
P_DSS_WRITE = DataStructureScope.write


class FeatureLayerSerializer(Serializer):
    identity = "feature_layer"
    resclass = LayerFieldsMixin

    fields = _fields_attr(read=P_DSS_READ, write=P_DSS_WRITE)


class FeatureQueryIntersectsMixin:
    def __init__(self):
        self._intersects = None

    def intersects(self, geom):
        reproject = geom.srid is not None and geom.srid not in self.srs_supported

        if reproject:
            srs_from = SRS.filter_by(id=geom.srid).one()
            transformer = Transformer(srs_from.wkt, self.layer.srs.wkt)
            geom = transformer.transform(geom)

        self._intersects = geom
