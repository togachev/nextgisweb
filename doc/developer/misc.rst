.. sectionauthor:: Dmitry Baryshnikov <dmitry.baryshnikov@nextgis.ru>

Miscellaneous
=============

Get resource data
-----------------

Geodatata can be fetched for vector and raster layers. For vector layers
(PostGIS and Vector) geodata returns in :term:`GeoJSON` or :term:`CSV` formats.
For raster layers (Raster, :term:`WMS`) - tiles (:term:`TMS`) or image.
For QGIS styles - qml file.

Export vector layer as file
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**The following request returns GPKG, GeoJSON or CSV file from vector layer**:

.. http:get:: /api/resource/(int:id)/export?format=GPKG&srs=4326&zipped=True&fid=ngw_id&encoding=UTF-8

**Example request**: https://sandbox.nextgis.com/api/resource/4308/export?format=GPKG&srs=4326&zipped=False&fid=ngw_id&encoding=UTF-8

Format string is case-sensitive. For formats and options list see https://docs.nextgis.ru/docs_ngcom/source/data_export.html

GeoJSON
^^^^^^^


**The following request returns GeoJSON file from vector layer**:

.. versionadded:: 3.0
.. http:get:: /api/resource/(int:id)/geojson

   GeoJSON file request

   :reqheader Accept: must be ``*/*``
   :reqheader Authorization: optional Basic auth string to authenticate
   :param id: resource identifier
   :statuscode 200: no error

**Example request**:

.. sourcecode:: http

   GET /api/resource/55/geojson HTTP/1.1
   Host: ngw_url
   Accept: */*

CSV
^^^

**The following request returns CSV file from vector layer**:

.. versionadded:: 3.0
.. http:get:: /api/resource/(int:id)/csv

   CSV file request

   :reqheader Accept: must be ``*/*``
   :reqheader Authorization: optional Basic auth string to authenticate
   :param id: resource identifier
   :statuscode 200: no error

**Example request**:

.. sourcecode:: http

   GET /api/resource/55/csv HTTP/1.1
   Host: ngw_url
   Accept: */*

Render
^^^^^^

**The following request returns TMS from raster layer**:

.. versionadded:: 3.0
.. http:get:: /api/component/render/tile?z=(int:z)&x=(int:x)&y=(int:y)&resource=(int:id1),(int:id2)...

    Tile request

    :reqheader Accept: must be ``*/*``
    :reqheader Authorization: optional Basic auth string to authenticate
    :query id1, id2: style resources id's
    :query z: zoom level
    :query x: tile number on x axis (horizontal)
    :query y: tile number on y axis (vertical)
    :query cache: optional parameter (defaults true). If value set false tile will render from scratch
    :query nd: Return code if tile not present. Available values are: 204, 404, 200. Defaults to 200.
    :statuscode 200: no error
    :statuscode 204: no tile
    :statuscode 404: no tile

**The following request returns image from raster layer**:

.. versionadded:: 3.0
.. http:get:: /api/component/render/image?extent=(float:minx),(float:miny),(float:maxx),(float:maxy)&size=(int:width),(int:height)&resource=(int:id1),(int:id2)...

    Image request

    :reqheader Accept: must be ``*/*``
    :reqheader Authorization: optional Basic auth string to authenticate
    :query id1, id2: style resources id's
    :query minx, miny, maxx, maxy: image spatial extent
    :query width, height: output image size
    :query cache: optional parameter (defaults true). If value set false tile will render from scratch
    :statuscode 200: no error

.. note:: Styles order should be from lower to upper.

**Example request**:

.. sourcecode:: http

   GET /api/component/render/tile?z=7&x=84&y=42&resource=234 HTTP/1.1
   Host: ngw_url
   Accept: */*

QML Style (QGIS Layer style)
^^^^^^^^^^^^^^^^^^^^^^^^^^^^

**The following request returns QML from QGIS style**:

.. versionadded:: 3.0.1
.. http:get:: /api/resource/(int:id)/qml

   QML file request

   :reqheader Accept: must be ``*/*``
   :reqheader Authorization: optional Basic auth string to authenticate
   :param id: resource identifier
   :statuscode 200: no error

**Example request**:

.. sourcecode:: http

   GET /api/resource/56/qml HTTP/1.1
   Host: ngw_url
   Accept: */*

MVT (vector tiles)
^^^^^^^^^^^^^^^^^^^

MVT data can be fetched only for NextGIS Web vector layer.

**The following request returns MVT data**:

.. versionadded:: 3.0.4
.. http:get:: /api/component/feature_layer/mvt?x=(int:x)&y=(int:y)&z=(int:z)&resource=(int:id1),(int:id2)...&simplification=(int:s)

    Vector tile request

    :reqheader Accept: must be ``*/*``
    :reqheader Authorization: optional Basic auth string to authenticate
    :query id1, id2: Vector or PostGIS layers identifies
    :query z: zoom level
    :query x: tile number on x axis (horizontal)
    :query y: tile number on y axis (vertical)
    :query s: simplification level (0 - no simplification, 8 - default value)
    :statuscode 200: no error

.. note:: Vector or PostGIS layers identifies order should be from lower to upper. 

Layers names in MVT will be `ngw:(int:id)`, where id is vector or PostGIS layer identifier. 

**Example request**:

.. sourcecode:: http

   GET /api/component/feature_layer/mvt?resource=56&z=11&x=1234&y=543 HTTP/1.1
   Host: ngw_url
   Accept: */*

.. deprecated:: 3.0.4
.. http:get:: /api/resource/(int:id)/(int:z)/(int:x)/(int:y).mvt

   MVT request
   
   :deprecated:
   :reqheader Accept: must be ``*/*``
   :reqheader Authorization: optional Basic auth string to authenticate
   :param id: resource identifier
   :param z:  zoom level
   :param x:  x tile column
   :param y:  y tile row
   :statuscode 200: no error

**Example request**:

.. sourcecode:: http

   GET /api/resource/56/11/1234/543.mvt HTTP/1.1
   Host: ngw_url
   Accept: */*

Identify by polygon
-------------------------

To get features intersected by a polygon execute following request.

.. http:post:: /api/feature_layer/identify

   Identification request

   :reqheader Accept: must be ``*/*``
   :reqheader Authorization: optional Basic auth string to authenticate
   :<json int srs: Spatial reference identifier
   :<json string geom: Polygon in WKT format
   :<jsonarr int layers: layers id array
   :statuscode 200: no error

**Example request**:

.. sourcecode:: http

   POST /api/feature_layer/identify HTTP/1.1
   Host: ngw_url
   Accept: */*

   {
       "srs":3857,
       "geom":"POLYGON((4188625.8318882 7511123.3382522,4188683.1596594 7511123.
                        3382522,4188683.1596594 7511180.6660234,4188625.8318882
                        7511180.6660234,4188625.8318882 7511123.3382522))",
       "layers":[2,5]
   }

**Example response**:

.. sourcecode:: json

    {
      "2": {
        "featureCount": 1,
        "features": [
          {
            "fields": {
              "Id": 25,
              "name": "Church 1514-1925"
            },
            "id": 3,
            "label": "#3",
            "layerId": 2
          }
        ]
      },
      "5": {
        "featureCount": 0,
        "features": []
      },
      "featureCount": 1
    }
