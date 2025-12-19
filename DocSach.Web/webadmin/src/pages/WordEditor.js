// src/components/WordEditor.js
import React, { useState } from "react";
import * as mammoth from "mammoth";
import { RichTextEditor } from "@mantine/rte";

export default function WordEditor({ value, onChange }) {
    const [fileName, setFileName] = useState("");

    const handleFile = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileName(file.name);

        const reader = new FileReader();
        reader.onload = async (event) => {
            const arrayBuffer = event.target.result;

            // Chuyển Word -> HTML
            const result = await mammoth.convertToHtml({ arrayBuffer });
            onChange(result.value); // set lên editor
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <div>
            <label style={{ display: "block", marginBottom: 8 }}>
                Chọn file Word để nhập nội dung:
            </label>
            <input type="file" accept=".docx" onChange={handleFile} />
            {fileName && <p>Tệp đã chọn: {fileName}</p>}

            <RichTextEditor
                value={value}
                onChange={onChange}
                style={{ minHeight: 300, marginTop: 16 }}
            />
        </div>
    );
}
