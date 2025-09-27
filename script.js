/* 
Your implementation should include the following: 
a) Text Formatting 
Bold, Italic, Underline 
Headings (H1, H2, etc.) 
Font size adjustments 
Font styles (at least 2–3 variations) 
Text alignment: Left, Center, Right, Justify 
Text color & highlight 

b) Lists & Structure 
Ordered list (numbers) 
Unordered list (bullets) 
Indentation (increase/decrease) 

c) Insert Options 
Insert hyperlink 
Insert images (from local system or via URL) 
Insert table (basic: rows × columns) 

d) Document Operations 
Clear formatting option 
Reset editor content 
Copy as plain text / copy as HTML 
Preview before download 

e) Export Options 
Export document as Word (.doc) 
Export document as PDF 
Title and Author metadata included in exported file 

3. Technical Requirements 

Integration with WordPress 
The final HTML file should work inside a WordPress Custom HTML block 
Optionally, package it as a simple WordPress page template 
allowed libraries: minimal libraries like html2pdf.js for PDF conversion 
Not allowed: heavy WYSIWYG editors (TinyMCE, CKEditor, etc.) — you must build the core functionalities manually 

6. Bonus (Optional Enhancements) 
Add Find & Replace feature 
Add Dark mode / Light mode toggle 
Add Auto-save (local storage) 
Allow inserting page breaks for PDF export 

What are the things: text, list, import, document, export 
What are the nouns: text, list, import. document, export 
*/

const editor = document.getElementById("editor");

class WordDoc {
    apply(command, value = null) {
        document.execCommand(command, false, value);
        editor.focus();
    }

    clearFormat() {
        document.execCommand("removeFormat", false, null);
        editor.focus();
    }

    resetEditor() {
        editor.innerHTML = "Type your text here...";
    }

    copyText() {
        navigator.clipboard.writeText(editor.innerText);
    }

    exportDoc() {
        const html = editor.innerHTML;
        const blob = new Blob([html], { type: "application/msword" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = "document.doc";
        link.click();
    }

    exportPDF() {
        if (typeof html2pdf !== 'undefined') {
            html2pdf().from(editor).save("document.pdf");
        } else {
            alert("html2pdf.js library not loaded");
        }
    }
}

class Text {
    constructor(doc) {
        this.doc = doc;
    }

    textBold() { this.doc.apply("bold"); }
    textItalic() { this.doc.apply("italic"); }
    textUnderline() { this.doc.apply("underline"); }
    textHeading(level = 1) { this.doc.apply("formatBlock", `<H${level}>`); }
    textSize(size) {
        document.execCommand("fontSize", false, "7"); 
        editor.querySelectorAll("font[size='7']").forEach(el => el.style.fontSize = size);
    }
    textFont(font) { this.doc.apply("fontName", font); }
    textAlignment(align) { 
        switch (align) {
            case "left": this.doc.apply("justifyLeft"); break;
            case "center": this.doc.apply("justifyCenter"); break;
            case "right": this.doc.apply("justifyRight"); break;
            case "justify": this.doc.apply("justifyFull"); break;
        }
    }
    textColor(color) { this.doc.apply("foreColor", color); }
    textHighlight(color) { this.doc.apply("hiliteColor", color); }
}

class List {
    constructor(doc) { this.doc = doc; }
    orderedList() { this.doc.apply("insertOrderedList"); }
    unorderedList() { this.doc.apply("insertUnorderedList"); }
    indent() { this.doc.apply("indent"); }
    outdent() { this.doc.apply("outdent"); }
}

class Insert {
    constructor(doc) { this.doc = doc; }
    insertLink(url = "") {
        const link = url || prompt("Enter URL");
        if (link) this.doc.apply("createLink", link);
    }
    insertImage(url = "") {
        const img = url || prompt("Enter Image URL");
        if (img) this.doc.apply("insertImage", img);
    }
    insertTable(rows = 2, cols = 2) {
        let table = "<table style='border:1px solid black;border-collapse:collapse;'>";
        for (let r = 0; r < rows; r++) {
            table += "<tr>";
            for (let c = 0; c < cols; c++) {
                table += "<td style='border:1px solid black;padding:5px;'> </td>";
            }
            table += "</tr>";
        }
        table += "</table><br/>";
        this.doc.apply("insertHTML", table);
    }
}

const doc = new WordDoc();
const text = new Text(doc);
const list = new List(doc);
const insert = new Insert(doc);

document.querySelectorAll('[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
        const cmd = btn.dataset.command;
        const val = btn.dataset.value || null;
        doc.apply(cmd, val);
    });
});

document.getElementById("font-size").addEventListener('change', e => text.textSize(e.target.value));
document.getElementById("fontFamily").addEventListener('change', e => text.textFont(e.target.value));
document.getElementById("textColor").addEventListener('change', e => text.textColor(e.target.value));
document.getElementById("highlight").addEventListener('change', e => text.textHighlight(e.target.value));

document.getElementById("clear-format").addEventListener('click', () => doc.clearFormat());
document.getElementById("reset-editor").addEventListener('click', () => doc.resetEditor());
document.getElementById("copy-plain").addEventListener('click', () => doc.copyText());
document.getElementById("export-doc").addEventListener('click', () => doc.exportDoc());
document.getElementById("export-pdf").addEventListener('click', () => doc.exportPDF());

document.getElementById("insert-link").addEventListener('click', () => insert.insertLink());
document.getElementById("insert-image").addEventListener('click', () => insert.insertImage());
document.getElementById("insert-table").addEventListener('click', () => insert.insertTable());
document.querySelectorAll('#lists button').forEach(btn => {
    btn.addEventListener('click', () => {
        const command = btn.dataset.command;
        if (command === "insertOrderedList") list.orderedList();
        else if (command === "insertUnorderedList") list.unorderedList();
        else if (command === "indent") list.indent();
        else if (command === "outdent") list.outdent();
    });
});
