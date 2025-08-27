import {
    Alignment,
    Autoformat,
    AutoImage,
    AutoLink,
    Base64UploadAdapter,
    BlockQuote,
    Bold,
    ClassicEditor,
    Clipboard,
    Essentials,
    FindAndReplace,
    Font,
    FontFamily,
    GeneralHtmlSupport,
    Heading,
    Highlight,
    HorizontalLine,
    Image,
    ImageCaption,
    ImageInsert,
    ImageResize,
    ImageStyle,
    ImageToolbar,
    ImageUpload,
    Indent,
    Italic,
    Link,
    LinkImage,
    List,
    Paragraph,
    PasteFromOffice,
    PictureEditing,
    RemoveFormat,
    SourceEditing,
    SpecialCharacters,
    SpecialCharactersEssentials,
    Strikethrough,
    Table,
    TableCaption,
    TableCellProperties,
    TableColumnResize,
    TableProperties,
    TableToolbar,
    TextTransformation,
    Underline,
} from "ckeditor5";
import type { ArrayOrItem, EditorConfig, Translations } from "ckeditor5";

import "ckeditor5/ckeditor5.css";
import "./index.less";

const locale = ngwConfig.locale || "en";
let translationBundles: ArrayOrItem<Translations> | undefined = undefined;

if (locale !== "en") {
    try {
        const coreTranslations = await import(
            `ckeditor5/translations/${locale}.js`
        );
        translationBundles = [coreTranslations.default];
    } catch {
        console.log(`CKEditor: Translation uavailable for '${locale}'`);
    }
}

export class Editor extends ClassicEditor {
    constructor(element: HTMLElement | string, config: EditorConfig = {}) {
        config = {
            language: locale,
            translations: translationBundles,
            plugins: [
                AutoImage,
                Autoformat,
                Base64UploadAdapter,
                BlockQuote,
                Bold,
                Essentials,
                Font,
                FontFamily,
                GeneralHtmlSupport,
                Heading,
                Image,
                ImageCaption,
                ImageInsert,
                ImageStyle,
                ImageToolbar,
                ImageUpload,
                Indent,
                Italic,
                Link,
                List,
                Paragraph,
                PasteFromOffice,
                PictureEditing,
                SourceEditing,
                Strikethrough,
                Table,
                TableToolbar,
                TextTransformation,
                Underline,
                Clipboard,
                ImageResize,
                AutoLink,
                LinkImage,
                TableCaption,
                TableCellProperties,
                TableColumnResize,
                TableProperties,
                Alignment,
                FindAndReplace,
                Highlight,
                HorizontalLine,
                RemoveFormat,
                SpecialCharacters,
                SpecialCharactersEssentials,
            ],
            toolbar: {
                items: [
                    "undo",
                    "redo",
                    "|",
                    "highlight",
                    "fontSize", "fontFamily", "fontColor", "fontBackgroundColor",
                    "heading", "alignment", "bulletedList", "numberedList",
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
                    "|",
                    "sourceEditing",
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
            fontSize: {
                options: [
                    'tiny',
                    'default',
                    'small',
                    'huge',
                    'big'
                ],
            },
            fontColor: {
                colorPicker: {
                    // Use 'hex' format for output instead of 'hsl'.
                    format: 'hex'
                }
            },
            image: {
                insert: {
                    integrations: ["upload", "url"]
                },
                styles: ["alignCenter", "alignLeft", "alignRight"],
                toolbar: [
                    "imageStyle:alignBlockLeft",
                    "imageStyle:alignCenter",
                    "imageStyle:alignBlockRight",
                    "|",
                    "toggleImageCaption", "imageTextAlternative", "linkImage",
                    "|",
                    "resizeImage:original",
                    "resizeImage:50",
                    "resizeImage:75",
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
            link: {
                decorators: {
                    toggleDownloadable: {
                        mode: "manual",
                        label: "Downloadable",
                        attributes: {
                            download: "file"
                        }
                    },
                    openInNewTab: {
                        mode: "manual",
                        label: "Open in a new tab",
                        defaultValue: true,
                        attributes: {
                            target: "_blank",
                            rel: "noopener noreferrer"
                        }
                    }
                }
            },
            htmlSupport: {
                allow: [
                    {
                        name: "figure",
                        attributes: true,
                        classes: true,
                        styles: true,
                    },
                ],
            },
            ...config,
        };
        super(element, config);
    }
}
