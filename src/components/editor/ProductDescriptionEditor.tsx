import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Bold,
  Essentials,
  Font,
  Italic,
  Link,
  List,
  Paragraph,
  Underline,
  Undo,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";

export default function ProductDescriptionEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (nextValue: string) => void;
}) {
  return (
    <CKEditor
      editor={ClassicEditor}
      config={{
        licenseKey: "GPL",
        plugins: [
          Essentials,
          Bold,
          Italic,
          Paragraph,
          Link,
          List,
          Undo,
          Underline,
          Font,
        ],
        toolbar: [
          "undo",
          "redo",
          "|",
          "bold",
          "italic",
          "underline",
          "|",
          "bulletedList",
          "numberedList",
          "|",
          "link",
          "fontColor",
          "fontBackgroundColor",
        ],
        placeholder: "Enter product description...",
      }}
      data={value}
      onChange={(_event: unknown, editor: { getData: () => string }) => {
        onChange(editor.getData());
      }}
    />
  );
}

