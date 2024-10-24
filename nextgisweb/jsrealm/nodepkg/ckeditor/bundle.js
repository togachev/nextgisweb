/**
 * @license Copyright (c) 2014-2023, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

import UploadAdapter from "@ckeditor/ckeditor5-adapter-ckfinder/src/uploadadapter.js";
import Autoformat from "@ckeditor/ckeditor5-autoformat/src/autoformat.js";
import Bold from "@ckeditor/ckeditor5-basic-styles/src/bold.js";
import Italic from "@ckeditor/ckeditor5-basic-styles/src/italic.js";
import Strikethrough from "@ckeditor/ckeditor5-basic-styles/src/strikethrough.js";
import Underline from "@ckeditor/ckeditor5-basic-styles/src/underline.js";
import BlockQuote from "@ckeditor/ckeditor5-block-quote/src/blockquote.js";
import CKFinder from "@ckeditor/ckeditor5-ckfinder/src/ckfinder.js";
import ClassicEditor from "@ckeditor/ckeditor5-editor-classic/src/classiceditor.js";
import Font from "@ckeditor/ckeditor5-font/src/font.js";
import FontFamily from "@ckeditor/ckeditor5-font/src/fontfamily.js";
import Essentials from "@ckeditor/ckeditor5-essentials/src/essentials.js";
import Heading from "@ckeditor/ckeditor5-heading/src/heading.js";
import Image from "@ckeditor/ckeditor5-image/src/image.js";
import ImageCaption from "@ckeditor/ckeditor5-image/src/imagecaption.js";
import ImageInsert from "@ckeditor/ckeditor5-image/src/imageinsert.js";
import ImageStyle from "@ckeditor/ckeditor5-image/src/imagestyle.js";
import ImageToolbar from "@ckeditor/ckeditor5-image/src/imagetoolbar.js";
import ImageUpload from "@ckeditor/ckeditor5-image/src/imageupload.js";
import PictureEditing from "@ckeditor/ckeditor5-image/src/pictureediting.js";
import Indent from "@ckeditor/ckeditor5-indent/src/indent.js";
import Highlight from "@ckeditor/ckeditor5-highlight/src/highlight.js";
import Link from "@ckeditor/ckeditor5-link/src/link.js";
import List from "@ckeditor/ckeditor5-list/src/list.js";
import Paragraph from "@ckeditor/ckeditor5-paragraph/src/paragraph.js";
import PasteFromOffice from "@ckeditor/ckeditor5-paste-from-office/src/pastefromoffice.js";
import SourceEditing from "@ckeditor/ckeditor5-source-editing/src/sourceediting.js";
import Table from "@ckeditor/ckeditor5-table/src/table.js";
import TableProperties from "@ckeditor/ckeditor5-table/src/tableproperties.js";
import TableCellProperties from "@ckeditor/ckeditor5-table/src/tablecellproperties.js";
import TableCaption from "@ckeditor/ckeditor5-table/src/tablecaption.js";
import TableColumnResize from "@ckeditor/ckeditor5-table/src/tablecolumnresize.js";
import TableToolbar from "@ckeditor/ckeditor5-table/src/tabletoolbar.js";
import TextTransformation from "@ckeditor/ckeditor5-typing/src/texttransformation.js";
import Base64UploadAdapter from "@ckeditor/ckeditor5-upload/src/adapters/base64uploadadapter.js";
import CodeBlock from "@ckeditor/ckeditor5-code-block/src/codeblock.js";
import FindAndReplace from "@ckeditor/ckeditor5-find-and-replace/src/findandreplace.js";
import HorizontalLine from "@ckeditor/ckeditor5-horizontal-line/src/horizontalline.js";
import SpecialCharacters from "@ckeditor/ckeditor5-special-characters/src/specialcharacters.js";
import SpecialCharactersEssentials from "@ckeditor/ckeditor5-special-characters/src/specialcharactersessentials.js";
import Clipboard from "@ckeditor/ckeditor5-clipboard/src/clipboard.js";
import RemoveFormat from "@ckeditor/ckeditor5-remove-format/src/removeformat.js";

class Editor extends ClassicEditor {
    constructor(element, config) {
        config.language = window.ngwConfig.locale;
        super(element, config);
    }
}

// Plugins to include in the build.
Editor.builtinPlugins = [
    UploadAdapter,
    Autoformat,
    Bold,
    Italic,
    Strikethrough,
    Underline,
    BlockQuote,
    CKFinder,
    Font,
    FontFamily,
    Essentials,
    Heading,
    Image,
    ImageCaption,
    ImageInsert,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    PictureEditing,
    Indent,
    Highlight,
    Link,
    List,
    Paragraph,
    PasteFromOffice,
    SourceEditing,
    Table,
    TableProperties,
    TableCellProperties,
    TableCaption,
    TableColumnResize,
    TableToolbar,
    TextTransformation,
    Base64UploadAdapter,
    CodeBlock,
    FindAndReplace,
    HorizontalLine,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Clipboard,
    RemoveFormat,
];

// Editor configuration.
Editor.defaultConfig = {
    toolbar: {
        items: [
            "undo",
            "redo",
            'fontSize', 'fontFamily', 'fontColor', 'fontBackgroundColor',
            'heading', 'bulletedList', 'numberedList',
            "|",
            "bold",
            "italic",
            "underline",
            "strikethrough",
            "|",
            "link",
            "imageInsert",
            "insertTable",
            "blockQuote",
            "|",
            "outdent",
            "indent",
            "highlight",
            "|",
            "sourceEditing",
            "codeBlock",
            "findAndReplace",
            "horizontalLine",
            "specialCharacters",
            "removeFormat",
        ],
    shouldNotGroupWhenFull: true,
    },
    fontFamily: {
        supportAllValues: true
    },
    image: {
        toolbar: [
            "imageStyle:inline",
            "imageStyle:block",
            "imageStyle:side",
            "|",
            "toggleImageCaption",
            "imageTextAlternative",
        ],
    },
    table: {
        contentToolbar: [
            "tableColumn",
            "tableRow",
            "mergeTableCells",
            "tableProperties",
            "tableCellProperties",
            "toggleTableCaption"
        ],
    },

    // This value must be kept in sync with the language defined in webpack.config.js.
    language: "en",
};

// eslint-disable-next-line no-undef
Editor.availableLanguages = AVAILABLE_LANGUAGES;

export default Editor;
