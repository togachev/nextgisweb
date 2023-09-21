from collections import namedtuple

EXPORT_FORMAT_GDAL = dict()


GDALDriver = namedtuple(
    "GDALDriver",
    [
        "name",
        "display_name",
        "extension",
        "options",
        "mime",
    ],
)

EXPORT_FORMAT_GDAL["GTiff"] = GDALDriver(
    "GTiff",
    "GeoTIFF (*.tif)",
    "tif",
    options=("COMPRESS=LZW",),
    mime="image/tiff; application=geotiff",
)

EXPORT_FORMAT_GDAL["HFA"] = GDALDriver(
    "HFA", "ERDAS IMAGINE HFA (*.img)", "img", options=("BLOCKSIZE=64",), mime=None
)

EXPORT_FORMAT_GDAL["RMF"] = GDALDriver(
    "RMF",
    "Panorama RMF (*.rsw)",
    "rsw",
    options=(
        "COMPRESS=LZW",
        "RMFHUGE=IF_SAFER",
    ),
    mime=None,
)

GDAL_DRIVER_NAME_2_EXPORT_FORMATS = [
    {"name": format.name, "display_name": format.display_name}
    for _, format in EXPORT_FORMAT_GDAL.items()
]
