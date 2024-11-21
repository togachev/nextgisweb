from lxml.etree import tounicode
from lxml.html import document_fromstring
from lxml.html.clean import Cleaner

_cleaner = Cleaner()

attrs = ['abbr', 'accesskey', 'align', 'alt', 'autocomplete', 'axis', 'background', 'bgcolor', 'border', 'cellpadding', 'cellspacing', 'char', 'charoff', 'class', 'cols', 'colspan', 'disabled', 'headers', 'height', 'href', 'src', 'id', 'lang', 'leftmargin', 'marginheight', 'marginwidth', 'media', 'name', 'nowrap', 'onblur', 'onclick', 'ondblclick', 'onfocus', 'onmousedown', 'onmouseover', 'onmouseup', 'readonly', 'rows', 'rowspan', 'scope', 'shape', 'size', 'style', 'title', 'topmargin', 'valign', 'width']

def sanitize(text, *, validate=False):
    if text is None:
        return None

    # LXML should handle anything without exceptions
    doc = document_fromstring("<html><body>" + text + "</body></html>")

    _cleaner.safe_attrs_only = True
    _cleaner.safe_attrs=frozenset(attrs)
    cleaned = _cleaner.clean_html(doc)

    if validate:
        if not compare(doc.body, cleaned.body):
            raise ValueError

    outbody = cleaned.body
    return (
        (outbody.text if outbody.text is not None else "")
        + "".join(tounicode(el, method="html") for el in outbody)
        + (outbody.tail if outbody.tail is not None else "")
    )


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
