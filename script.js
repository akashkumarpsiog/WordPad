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

/* All of the elements in JS has a .dataset property. We get the map of all the data- attributes. */

const editorContainer = document.getElementById("editor-container");
let currentPage = createNewPage();

if (localStorage.getItem("editorContent")) {
    editorContainer.innerHTML = localStorage.getItem("editorContent");
    currentPage = editorContainer.querySelector(".page:last-child") || createNewPage();
}

function createNewPage() {
    const page = document.createElement("div");
    page.className = "page";
    page.contentEditable = true;

    page.addEventListener("input", () => {
        checkPageOverflow(page);
        localStorage.setItem("editorContent", editorContainer.innerHTML);
    });
    page.addEventListener("paste", () => setTimeout(() => checkPageOverflow(page), 0));

    editorContainer.appendChild(page);
    page.focus();
    return page;
}

function checkPageOverflow(page) {
    const pageHeight = page.clientHeight;
    let contentHeight = page.scrollHeight;
    if (contentHeight <= pageHeight) return;

    const nodesToMove = [];
    while (page.scrollHeight > pageHeight && page.lastChild) {
        nodesToMove.unshift(page.lastChild);
        page.removeChild(page.lastChild);
    }

    const newPage = createNewPage();
    nodesToMove.forEach(node => newPage.appendChild(node));

    const range = document.createRange();
    range.selectNodeContents(newPage);
    range.collapse(false);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);

    currentPage = newPage;
}

class WordDoc {
    apply(command, value = null) {
        document.execCommand(command, false, value);
        currentPage.focus();
    }

    clearFormat() {
        document.execCommand("removeFormat", false, null);
        currentPage.focus();
    }

    resetEditor() {
        editorContainer.innerHTML = "";
        localStorage.removeItem("editorContent"); 
        currentPage = createNewPage();
    }

    copyText() {
        const text = Array.from(editorContainer.querySelectorAll(".page"))
            .map(p => p.innerText).join("\n\n");
        navigator.clipboard.writeText(text);
    }

    findReplace(find, replace) {
        const pages = editorContainer.querySelectorAll(".page");
        pages.forEach(page => this.replaceInNode(page, find, replace));
    }

    replaceInNode(node, find, replace) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (node.textContent.includes(find)) {
                node.textContent = node.textContent.replaceAll(find, replace);
            }
        } else {
            node.childNodes.forEach(child => this.replaceInNode(child, find, replace));
        }
    }

    preview() {
        const title = prompt("Enter title", "Document");
        const fullHtml = `
            <html>
            <head>
                <title>${title}</title>
                <style>
                    .page { page-break-after: always; }
                </style>
            </head>
            <body>
                ${Array.from(editorContainer.querySelectorAll(".page"))
                    .map(p => `<div class="page">${p.innerHTML}</div>`).join('')}
            </body>
            </html>
        `;
        const previewWin = window.open();
        previewWin.document.documentElement.innerHTML=fullHtml;
    }

    exportDoc() {
        const title = prompt("Enter title", "Document");
        const fullHtml = `
            <html>
            <head>
                <title>${title}</title>
                <style>
                    .page { page-break-after: always; }
                </style>
            </head>
            <body>
                ${Array.from(editorContainer.querySelectorAll(".page"))
                    .map(p => `<div class="page">${p.innerHTML}</div>`).join('')}
            </body>
            </html>
        `;
        const blob = new Blob([fullHtml], { type: "application/msword" });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title}.doc`;
        link.click();
    }

    exportPDF() {
        const title = prompt("Enter title", "Document");
        const pages = Array.from(editorContainer.querySelectorAll(".page"));
        if (typeof html2pdf !== 'undefined') {
            const combined = document.createElement("div");
            pages.forEach(p => {
                const clone = p.cloneNode(true);
                clone.style.marginBottom = "20px";
                clone.style.pageBreakAfter = "always";
                combined.appendChild(clone);
            });
            html2pdf().set({
                filename: `${title}.pdf`,
                jsPDF: { author: author, title: title }
            }).from(combined).save();
        } else {
            alert("html2pdf.js not loaded");
        }
    }
}

class Text {
    constructor(doc) { this.doc = doc; }
    textBold() { this.doc.apply("bold"); }
    textItalic() { this.doc.apply("italic"); }
    textUnderline() { this.doc.apply("underline"); }
    textHeading(level = 1) { this.doc.apply("formatBlock", `<H${level}>`); }
    textSize(size) {
        document.execCommand("fontSize", false, "7");
        currentPage.querySelectorAll("font[size='7']").forEach(el => el.style.fontSize = size + "px");
    }
    textFont(font) { this.doc.apply("fontName", font); }
    textAlignment(align) {
        const map = { left: "justifyLeft", center: "justifyCenter", right: "justifyRight", justify: "justifyFull" };
        this.doc.apply(map[align]);
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
        if (link) {
            this.doc.apply("createLink", link);
        }
    }

    insertImage(url = "") {
        const img = url || prompt("Enter Image URL");
        if (img) {
            const html = `<img src="${img}" style="max-width:100%; display:block;">`;
            this.doc.apply("insertHTML", html);
            checkPageOverflow(currentPage);
        }
    }

    insertLocalImage() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = e => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = ev => {
                    const html = `<img src="${ev.target.result}" style="max-width:100%; display:block;">`;
                    this.doc.apply("insertHTML", html);
                    checkPageOverflow(currentPage);
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
    }

    insertTable(rows = 2, cols = 2) {
        let table = "<table style='border:1px solid black;border-collapse:collapse;width:100%;'>";
        for (let r = 0; r < rows; r++) {
            table += "<tr>";
            for (let c = 0; c < cols; c++) {
                table += "<td style='border:1px solid black;padding:5px;'>&nbsp;</td>";
            }
            table += "</tr>";
        }
        table += "</table><br/>";
        this.doc.apply("insertHTML", table);
        checkPageOverflow(currentPage);
    }
}

const doc = new WordDoc();
const text = new Text(doc);
const list = new List(doc);
const insert = new Insert(doc);

document.querySelectorAll('[data-command]').forEach(btn => {
    btn.addEventListener('click', () => {
        const cmd = btn.dataset.command;
        doc.apply(cmd);
    });
});

document.getElementById("formatBlock").addEventListener('change', e => {
    doc.apply("formatBlock", `<${e.target.value.toUpperCase()}>`);
});

document.getElementById("font-size").addEventListener('change', e => text.textSize(e.target.value));
document.getElementById("fontFamily").addEventListener('change', e => text.textFont(e.target.value));
document.getElementById("textColor").addEventListener('change', e => text.textColor(e.target.value));
document.getElementById("highlight").addEventListener('change', e => text.textHighlight(e.target.value));

document.getElementById("find-replace").addEventListener('click', () => {
    document.getElementById("find-replace-modal").classList.remove("hidden");
});

document.getElementById("replace-btn").addEventListener('click', () => {
    const find = document.getElementById("find-text").value;
    const replace = document.getElementById("replace-text").value;
    doc.findReplace(find, replace);
    document.getElementById("find-replace-modal").classList.add("hidden");
});

document.getElementById("find-replace-cancel").addEventListener('click', () => {
    document.getElementById("find-replace-modal").classList.add("hidden");
});

document.getElementById("clear-format").addEventListener('click', () => doc.clearFormat());
document.getElementById("reset-editor").addEventListener('click', () => doc.resetEditor());
document.getElementById("copy-plain").addEventListener('click', () => doc.copyText());
document.getElementById("preview").addEventListener('click', () => doc.preview());

document.getElementById("export-doc").addEventListener('click', () => doc.exportDoc());
document.getElementById("export-pdf").addEventListener('click', () => doc.exportPDF());
document.getElementById("insert-link").addEventListener('click', () => insert.insertLink());
document.getElementById("insert-image").addEventListener('click', () => insert.insertImage());
document.getElementById("insert-local-image").addEventListener('click', () => insert.insertLocalImage());

document.getElementById("insert-table").addEventListener('click', () => {
    const rows = prompt("Enter number of rows", 2);
    const cols = prompt("Enter number of columns", 2);
    insert.insertTable(rows, cols);
});

document.querySelectorAll('#lists button').forEach(btn => {
    btn.addEventListener('click', () => {
        const cmd = btn.dataset.command;
        if (cmd === "insertOrderedList") list.orderedList();
        else if (cmd === "insertUnorderedList") list.unorderedList();
        else if (cmd === "indent") list.indent();
        else if (cmd === "outdent") list.outdent();
    });
});

document.getElementById("toggle-theme").addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('theme', document.body.classList.contains('dark-mode') ? 'dark' : 'light');
});

if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark-mode');
