from __future__ import annotations

import re
from datetime import datetime
from typing import Any, Dict, Union

import sqlalchemy as sa
import sqlalchemy.orm as orm
from msgspec import UNSET, Struct, UnsetType
from PIL import Image, UnidentifiedImageError
from PIL.Image import DecompressionBombError
from sqlalchemy.dialects import postgresql as pg

from nextgisweb.env import Base

from nextgisweb.feature_layer.versioning import (
    ActColValue,
    FVersioningExtensionMixin,
    auto_description,
    register_change,
)
from nextgisweb.file_storage import FileObj
from nextgisweb.file_upload import FileUpload
from nextgisweb.resource import Resource

Base.depends_on("resource", "feature_layer")


KEYNAME_RE = re.compile(r"[a-z_][a-z0-9_]*", re.IGNORECASE)


class FeatureAttachment(Base, FVersioningExtensionMixin):
    __tablename__ = "feature_attachment"

    id = sa.Column(sa.Integer, primary_key=True)
    resource_id = sa.Column(sa.ForeignKey(Resource.id), nullable=False)
    feature_id = sa.Column(sa.Integer, nullable=False)

    fileobj_id = sa.Column(sa.ForeignKey(FileObj.id), nullable=False)
    keyname = sa.Column(sa.Unicode, nullable=True)
    name = sa.Column(sa.Unicode, nullable=True)
    mime_type = sa.Column(sa.Unicode, nullable=False)
    description = sa.Column(sa.Unicode, nullable=True)

    size = sa.Column(sa.BigInteger, nullable=False)
    file_meta = sa.Column(pg.JSONB, nullable=True)

    __table_args__ = (
        sa.Index("feature_attachment_resource_id_feature_id_idx", resource_id, feature_id),
        sa.UniqueConstraint(
            resource_id,
            feature_id,
            keyname,
            deferrable=True,
            initially="DEFERRED",
            name="feature_attachment_keyname_unique",
        ),
    )

    fversioning_metadata_version = 1
    fversioning_extension = "attachment"
    fversioning_columns = ["fileobj_id", "keyname", "name", "mime_type", "description"]
    fversioning_htab_args = [
        sa.ForeignKeyConstraint(
            ["fileobj_id"],
            [FileObj.id],
            name="feature_attachment_ht_fileobj_id_fkey",
        )
    ]

    fileobj = orm.relationship(FileObj, lazy="joined")
    resource = orm.relationship(
        Resource,
        backref=orm.backref(
            "_backref_feature_attachment",
            cascade="all",
            cascade_backrefs=False,
        ),
    )

    def extract_meta(self):
        _file_meta = {}
        if self.is_image:
            try:
                image = Image.open(self.fileobj.filename())
            except (UnidentifiedImageError, DecompressionBombError):
                pass
            else:
                if exif := image.getexif():
                    if tstamp := exif.get(306):  # Timestamp EXIF tag
                        try:
                            tstamp = datetime.strptime(tstamp, r"%Y:%m:%d %H:%M:%S").isoformat()
                        except ValueError:
                            pass
                        else:
                            _file_meta["timestamp"] = tstamp
                if (
                    (xmp_root := image.getxmp())
                    and (xmp_meta := xmp_root.get("xmpmeta"))
                    and (xmp_rdf := xmp_meta.get("RDF"))
                    and (xmp_desc := xmp_rdf.get("Description"))
                ):
                    if isinstance(xmp_desc, list):
                        xmp_desc = xmp_desc[0] if len(xmp_desc) > 0 else {}
                    if projection := xmp_desc.get("ProjectionType"):
                        _file_meta["panorama"] = {"ProjectionType": projection}
        self.file_meta = _file_meta

    @property
    def is_image(self):
        return self.mime_type in ("image/jpeg", "image/png")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "keyname": self.keyname,
            "size": self.size,
            "mime_type": self.mime_type,
            "description": self.description,
            "is_image": self.is_image,
            "file_meta": self.file_meta,
        }

    def deserialize(self, data):
        updated = False
        for k in ("name", "keyname", "mime_type", "description"):
            if k in data:
                v = data[k]
                if v != getattr(self, k):
                    setattr(self, k, v)
                    updated = True

        if (file_upload := data.get("file_upload")) is not None:
            file_upload_obj = FileUpload(file_upload)
            self.fileobj = file_upload_obj.to_fileobj()

            for k in ("name", "mime_type"):
                if k in file_upload:
                    setattr(self, k, file_upload[k])

            self.size = file_upload_obj.data_path.stat().st_size
            self.extract_meta()
            updated = True

        return updated

    @classmethod
    def fversioning_change_from_query(
        cls,
        action: ActColValue,
        fid: int,
        aid: int,
        vid: int,
        values: Dict[str, Any],
    ) -> Union[AttachmentCreate, AttachmentUpdate, AttachmentDelete]:
        if action in ("C", "U"):
            if action == "C":
                cid = AttachmentCreate
                values = {k: v for k, v in values.items() if v is not None}
            else:
                cid = AttachmentUpdate
                values = dict(values)
            if fileobj := values.pop("fileobj_id", None):
                values["fileobj"] = fileobj
            return cid(fid=fid, aid=aid, vid=vid, **values)
        elif action == "D":
            return AttachmentDelete(fid=fid, aid=aid, vid=vid)
        else:
            raise NotImplementedError(f"{action=}")


@register_change
@auto_description
class AttachmentCreate(Struct, kw_only=True, tag="attachment.create", tag_field="action"):
    fid: int
    aid: int
    vid: int
    fileobj: int
    keyname: Union[str, UnsetType] = UNSET
    name: Union[str, UnsetType] = UNSET
    mime_type: str
    description: Union[str, UnsetType] = UNSET


@register_change
@auto_description
class AttachmentUpdate(Struct, kw_only=True, tag="attachment.update", tag_field="action"):
    fid: int
    aid: int
    vid: int
    fileobj: Union[int, UnsetType] = UNSET
    keyname: Union[str, None, UnsetType] = UNSET
    name: Union[str, None, UnsetType] = UNSET
    mime_type: Union[str, UnsetType] = UNSET
    description: Union[str, None, UnsetType] = UNSET


@register_change
@auto_description
class AttachmentDelete(Struct, kw_only=True, tag="attachment.delete", tag_field="action"):
    fid: int
    vid: int
    aid: int
