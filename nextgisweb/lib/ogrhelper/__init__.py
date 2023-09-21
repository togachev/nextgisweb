import pathlib
import zipfile
from contextlib import contextmanager
from datetime import date, datetime, time

from osgeo import gdal, ogr

FIELD_GETTER = {}

OGR_VRT_LAYER = """
<OGRVRTLayer name="{}">
    <SrcDataSource relativeToVRT="0">{}</SrcDataSource>
    <LayerSRS>WGS84</LayerSRS>
    <GeometryField encoding="PointFromColumns" x="lon" y="lat" reportSrcColumn="false"/>
</OGRVRTLayer>
"""


@contextmanager
def ogr_use_exceptions():
    if ogr.GetUseExceptions():
        yield
        return

    ogr.UseExceptions()
    try:
        yield
    finally:
        ogr.DontUseExceptions()


def read_dataset(filename, **kw):
    vrt_layers = None
    source_filename = kw.pop("source_filename", None)
    allowed_drivers = kw.pop("allowed_drivers", ())
    if source_filename is not None:
        suffix = pathlib.Path(source_filename).suffix.lower()
        if suffix in (".csv", ".xlsx"):
            allowed_drivers += ("OGR_VRT",)
            dst_path = pathlib.Path(filename).with_suffix(suffix)
            if not (dst_path.is_symlink() or dst_path.is_file()):
                dst_path.symlink_to(filename)

            vrt_layers = ""
            ogrds = gdal.OpenEx(str(dst_path), 0)
            for i in range(ogrds.GetLayerCount()):
                layer = ogrds.GetLayer(i)
                vrt_layers += OGR_VRT_LAYER.format(layer.GetName(), dst_path)

    kw["allowed_drivers"] = allowed_drivers

    if vrt_layers is not None:
        ogrfn = "<OGRVRTDataSource>{}</OGRVRTDataSource>".format(vrt_layers)
    elif zipfile.is_zipfile(filename):
        ogrfn = "/vsizip/{%s}" % str(filename)
    else:
        ogrfn = str(filename)
    return gdal.OpenEx(ogrfn, 0, **kw)


def read_layer_features(layer, geometry_format=None):
    geometry_format = "wkt" if geometry_format is None else geometry_format.lower()
    if geometry_format == "raw":
        geom_func = _geometry_copy
    elif geometry_format == "wkt":
        geom_func = _geometry_wkt
    elif geometry_format == "wkb":
        geom_func = _geometry_wkb

    defn = layer.GetLayerDefn()
    fieldmap = list()
    for fidx in range(defn.GetFieldCount()):
        fdefn = defn.GetFieldDefn(fidx)
        fname = fdefn.GetName()
        fget = FIELD_GETTER[fdefn.GetType()]
        fieldmap.append((fidx, fname, fget))

    for feat in layer:
        geom = feat.GetGeometryRef()
        if geom is not None:
            geom = geom_func(geom)

        yield (
            feat.GetFID(),
            geom,
            [
                (fname, fget(feat, fidx) if not feat.IsFieldNull(fidx) else None)
                for (fidx, fname, fget) in fieldmap
            ],
        )


def geometry_force_multi(ogr_geom):
    geom_type = ogr_geom.GetGeometryType()
    if geom_type == ogr.wkbPoint:
        return ogr.ForceToMultiPoint(ogr_geom)
    if geom_type == ogr.wkbLineString:
        return ogr.ForceToMultiLineString(ogr_geom)
    if geom_type == ogr.wkbPolygon:
        return ogr.ForceToMultiPolygon(ogr_geom)
    return ogr_geom


def cohere_bytes(value):
    if isinstance(value, bytearray):
        return bytes(value)
    elif isinstance(value, bytes):
        return value
    else:
        raise ValueError(f"Bytes or bytearray expected, got {type(value).__name__}")


def _geometry_copy(ogr_geom):
    return ogr_geom.Clone()


def _geometry_wkt(ogr_geom):
    return ogr_geom.ExportToWkt()


def _geometry_wkb(ogr_geom):
    return ogr_geom.ExportToWkb(ogr.wkbNDR)


def _get_integer(feat, fidx):
    return feat.GetFieldAsInteger(fidx)


def _get_integer_list(feat, fidx):
    return feat.GetFieldAsIntegerList(fidx)


def _get_integer64(feat, fidx):
    return feat.GetFieldAsInteger64(fidx)


def _get_integer64_list(feat, fidx):
    return feat.GetFieldAsInteger64List(fidx)


def _get_real(feat, fidx):
    return feat.GetFieldAsDouble(fidx)


def _get_real_list(feat, fidx):
    return feat.GetFieldAsDoubleList(fidx)


def _get_string(feat, fidx):
    return feat.GetFieldAsString(fidx)


def _get_string_list(feat, fidx):
    return feat.GetFieldAsStringList(fidx)


def _get_date(feat, fidx):
    return date(*feat.GetFieldAsDateTime(fidx)[0:3])


def _get_time(feat, fidx):
    hour, minute, sec = feat.GetFieldAsDateTime(fidx)[3:6]
    sec_int = int(sec)
    msec = int((sec - sec_int) * 1000)
    return time(hour, minute, sec_int, msec)


def _get_datetime(feat, fidx):
    year, month, day, hour, minute, sec = feat.GetFieldAsDateTime(fidx)[0:6]
    sec_int = int(sec)
    msec = int((sec - sec_int) * 1000)
    return datetime(year, month, day, hour, minute, sec_int, msec)


FIELD_GETTER[ogr.OFTInteger] = _get_integer
FIELD_GETTER[ogr.OFTIntegerList] = _get_integer_list
FIELD_GETTER[ogr.OFTInteger64] = _get_integer64
FIELD_GETTER[ogr.OFTInteger64List] = _get_integer64_list
FIELD_GETTER[ogr.OFTReal] = _get_real
FIELD_GETTER[ogr.OFTRealList] = _get_real_list
FIELD_GETTER[ogr.OFTString] = _get_string
FIELD_GETTER[ogr.OFTStringList] = _get_string_list
FIELD_GETTER[ogr.OFTDate] = _get_date
FIELD_GETTER[ogr.OFTTime] = _get_time
FIELD_GETTER[ogr.OFTDateTime] = _get_datetime
