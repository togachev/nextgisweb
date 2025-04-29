from pyramid.httpexceptions import HTTPNotFound
from pyramid.response import FileResponse, Response

from nextgisweb.resource import resource_factory

from io import BytesIO
from PIL import Image

def preview(resource, request):
    if resource.social is None or resource.social.preview_fileobj is None:
        raise HTTPNotFound()

    fn = resource.social.preview_fileobj.filename()
    return FileResponse(fn, content_type="image/png", request=request)

def maptile(resource, request):
    if resource.social is None or resource.social.preview_fileobj is None:
        raise HTTPNotFound()

    fn = resource.social.preview_fileobj.filename()

    img = Image.open(fn)
    
    img.thumbnail(size=(300, 200))

    mem_file = BytesIO()
    img.save(mem_file, "WEBP", quality=100)
    mem_file.seek(0)

    return Response(mem_file.getvalue(), content_type="image/webp", request=request)

def setup_pyramid(comp, config):
    config.add_route(
        "resource.preview",
        "/api/resource/{id}/preview.png",
        factory=resource_factory,
        get=preview,
    )

    config.add_route(
        "maptile.preview",
        "/api/resource/{id}/maptile",
        factory=resource_factory,
        get=maptile,
    )
