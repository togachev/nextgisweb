import nh3
from lxml.html import document_fromstring

ALLOWED_INLINE_TAGS = {
    "a",
    "abbr",
    "b",
    "bdo",
    "br",
    "cite",
    "code",
    "del",
    "dfn",
    "em",
    "i",
    "ins",
    "kbd",
    "mark",
    "meter",
    "q",
    "ruby",
    "s",
    "samp",
    "small",
    "span",
    "strong",
    "sub",
    "sup",
    "time",
    "u",
    "var",
    "wbr",
}

ALLOWED_MEDIA_TAGS = {
    "audio",
    "img",
    "src",
    "figcaption",
    "figure",
    "object",
    "picture",
    "svg",
    "track",
    "video",
}

ALLOWED_BLOCK_TAGS = {
    "address",
    "aside",
    "blockquote",
    "caption",
    "col",
    "colgroup",
    "dd",
    "div",
    "dl",
    "dt",
    "footer",
    "form",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "header",
    "hgroup",
    "hr",
    "li",
    "ol",
    "p",
    "pre",
    "section",
    "table",
    "tbody",
    "td",
    "th",
    "thead",
    "tr",
    "tfoot",
    "ul",
}
DEFAULT_ALLOWED_TAGS = set(
    ["b", "i", "sub", "sup", "span", "u", "a", "br"]
    + ["p", "hr", "ul", "li", "ol", "div"]  # inline  # block
)
BASE_ALLOWED_TAGS = ALLOWED_INLINE_TAGS.union(ALLOWED_BLOCK_TAGS).union(ALLOWED_MEDIA_TAGS).union(DEFAULT_ALLOWED_TAGS)

DEFAULT_ALLOWED_ATTRIBUTES = {"*": {"id", "class", "style"}, "a": {"href"}, "img": {"src"}}

DEFAULT_ALLOWED_ATTRIBUTES_VALUES = {
    "*": {
        "style": {
            "text-align: center",
            "text-align: start",
            "text-align: end",
            "text-align: left",
            "text-align: right",
            "text-align: justify",
        },
    }
}

DEFAULT_ALLOWED_STYLES = {"*": {"text-align"}}

DEFAULT_URL_SCHEMES = {"http", "https", "mailto", "tel"} | {"data", "e1c"}

def sanitize(text, *, validate=False):
    if text is None:
        return None

    cleaned = nh3.clean(
        text,
        tags=BASE_ALLOWED_TAGS,
        attributes=DEFAULT_ALLOWED_ATTRIBUTES,
        tag_attribute_values=DEFAULT_ALLOWED_ATTRIBUTES_VALUES,
        url_schemes=DEFAULT_URL_SCHEMES,
    )

    if validate:
        # LXML should handle anything without exceptions
        doc = document_fromstring("<html><body>" + text + "</body></html>")
        doc_cleaned = document_fromstring("<html><body>" + cleaned + "</body></html>")
        if not compare(doc.body, doc_cleaned.body):
            raise ValueError

    return cleaned


def compare(a, b):
    if a.tag != b.tag or a.text != b.text or a.tail != b.tail:
        return False
    if len(a.attrib) != len(b.attrib):
        return False
    for k, v in a.attrib.items():
        if b.attrib.get(k) != v:
            return False
    if len(a) != len(b):
        return False
    for child1, child2 in zip(a, b):
        if not compare(child1, child2):
            return False
    return True