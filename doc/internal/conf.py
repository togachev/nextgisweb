templates_path = ["_template"]
exclude_patterns = ["_build"]

source_suffix = ".rst"
master_doc = "index"

project = "nextgisweb"
copyright = "2014-2016, NextGIS"

version = "2"
release = "2"

language = "en"

pygments_style = "sphinx"

extensions = [
    "sphinx.ext.autodoc",
    "sphinxcontrib.httpdomain",
]

autodoc_member_order = "bysource"
autoclass_content = "both"

http_index_shortname = "api"
html_theme_options = {"nosidebar": True}

# -- Options for HTML output ----------------------------------------------
