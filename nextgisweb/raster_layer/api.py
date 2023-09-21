import os
import tempfile
from io import DEFAULT_BUFFER_SIZE

from osgeo import gdal
from pyramid.response import FileIter, FileResponse, Response

from nextgisweb.env import _, env

from nextgisweb.core.exception import ValidationError
from nextgisweb.pyramid.util import set_output_buffering
from nextgisweb.resource import DataScope, resource_factory
from nextgisweb.spatial_ref_sys import SRS

from .gdaldriver import EXPORT_FORMAT_GDAL
from .model import RasterLayer

PERM_READ = DataScope.read
PERM_WRITE = DataScope.write


class RangeFileWrapper(FileIter):
    def __init__(self, file, block_size=DEFAULT_BUFFER_SIZE, offset=0, length=0):
        super().__init__(file=file, block_size=block_size)
        self.file.seek(offset, os.SEEK_SET)
        self.remaining = length

    def __next__(self):
        if self.remaining <= 0:
            raise StopIteration()
        data = self.file.read(min(self.remaining, self.block_size))
        if not data:
            raise StopIteration()
        self.remaining -= len(data)
        return data


def export(resource, request):
    request.resource_permission(PERM_READ)

    srs = SRS.filter_by(id=int(request.GET["srs"])).one() if "srs" in request.GET else resource.srs
    format = request.GET.get("format", "GTiff")
    bands = request.GET["bands"].split(",") if "bands" in request.GET else None

    if format is None:
        raise ValidationError(_("Output format is not provided."))

    if format not in EXPORT_FORMAT_GDAL:
        raise ValidationError(_("Format '%s' is not supported.") % (format,))

    driver = EXPORT_FORMAT_GDAL[format]

    filename = "%d.%s" % (
        resource.id,
        driver.extension,
    )
    content_disposition = "attachment; filename=%s" % filename

    def _warp(source_filename):
        with tempfile.NamedTemporaryFile(suffix=".%s" % driver.extension) as tmp_file:
            try:
                gdal.UseExceptions()
                gdal.Warp(
                    tmp_file.name,
                    source_filename,
                    options=gdal.WarpOptions(
                        format=driver.name, dstSRS=srs.wkt, creationOptions=driver.options
                    ),
                )
            except RuntimeError as e:
                raise ValidationError(str(e))
            finally:
                gdal.DontUseExceptions()

            response = FileResponse(tmp_file.name, content_type=driver.mime)
            response.content_disposition = content_disposition
            return response

    source_filename = env.raster_layer.workdir_filename(resource.fileobj)
    if bands is not None and len(bands) != resource.band_count:
        with tempfile.NamedTemporaryFile(suffix=".tif") as tmp_file:
            gdal.Translate(tmp_file.name, source_filename, bandList=bands)
            return _warp(tmp_file.name)
    else:
        return _warp(source_filename)


def cog(resource, request):
    request.resource_permission(PERM_READ)

    fn = env.raster_layer.workdir_filename(resource.fileobj)
    filesize = os.path.getsize(fn)

    if request.method == "HEAD":
        return Response(
            accept_ranges="bytes",
            content_length=filesize,
            content_type="image/geo+tiff",
        )

    if request.method == "GET":
        if not resource.cog:
            raise ValidationError(_("Requested raster is not COG."))

        range = request.range
        if range is None:
            raise ValidationError(_("Range header is missed or invalid."))

        content_range = range.content_range(filesize)
        if content_range is None:
            raise ValidationError(_("Range %s can not be read." % range))

        content_length = content_range.stop - content_range.start
        response = Response(
            status_code=206, content_range=content_range, content_type="image/geo+tiff"
        )

        response.app_iter = RangeFileWrapper(
            open(fn, "rb"), offset=content_range.start, length=content_length
        )
        response.content_length = content_length

        return response


def download(request):
    request.resource_permission(PERM_READ)

    filename = env.raster_layer.workdir_filename(request.context.fileobj)
    response = FileResponse(
        filename,
        content_type="image/tiff; application=geotiff",
        request=request,
    )
    response.content_disposition = "attachment; filename=%s.tif" % request.context.id
    set_output_buffering(request, response, False)
    return response


def setup_pyramid(comp, config):
    config.add_view(
        export,
        route_name="resource.export",
        context=RasterLayer,
        request_method="GET",
    )

    route_cog = config.add_route(
        "raster_layer.cog",
        "/api/resource/{id:uint}/cog",
        factory=resource_factory,
    )
    route_cog.head(cog, context=RasterLayer)
    route_cog.get(cog, context=RasterLayer)

    config.add_route(
        "raster_layer.download",
        "/api/resource/{id:uint}/download",
        factory=resource_factory,
    ).get(download, context=RasterLayer)
