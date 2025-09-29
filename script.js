const editorContainer = document.getElementById("editor-container");

editorContainer.addEventListener("click",(e)=>{
    if(e.target.tagName === "A"){
        e.preventDefault();
        window.open(e.target.href, '_blank');
    }
})
// saving the selection 
editorContainer.addEventListener("mouseup", e => {
    if (e.target.classList.contains("page")) saveSelection();
});
editorContainer.addEventListener("keyup", e => {
    if (e.target.classList.contains("page")) saveSelection();
});
//checking overflow and adding content to local storage
editorContainer.addEventListener("input", e => {
    if (e.target.classList.contains("page")) {
        checkPageOverflow(e.target);
        localStorage.setItem("editorContent", editorContainer.innerHTML);
    }
});
//when we add something new we are letting the dom load the image 
editorContainer.addEventListener("paste", e => {
    if (e.target.classList.contains("page")) 
        setTimeout(() => checkPageOverflow(e.target), 0);
});

let currentPage;

//getting content and storing to localstorage.
if (localStorage.getItem("editorContent")) {
editorContainer.innerHTML = localStorage.getItem("editorContent");
currentPage = editorContainer.querySelector(".page:last-child") || createNewPage();
}

if(!currentPage){
    currentPage=createNewPage();
}

function createNewPage() {
    const page = document.createElement("div");
    page.className = "page";
    page.contentEditable = true;
    editorContainer.appendChild(page);
    page.focus();
    return page;
}

function checkPageOverflow(page) {
    //scrollheight is the hieght of the content
    const pageHeight = page.clientHeight;
    let contentHeight = page.scrollHeight;
    if (contentHeight <= pageHeight) return;
    const nodesToMove = [];
    // if the scrollheight is greater then we add the lastchild to the array and remove it from page.
    while (page.scrollHeight > pageHeight && page.lastChild) {
    nodesToMove.unshift(page.lastChild);
    page.removeChild(page.lastChild);
}

//creating new page and adding that content there.
const newPage = createNewPage();
nodesToMove.forEach(node => newPage.appendChild(node));

//range api to move the cursor at the end of new page.
//then we select all the content inside the new page and move the cursor to the end.
const range = document.createRange();
range.selectNodeContents(newPage);
range.collapse(false); //this gets the new position the cursor should go to. 
const selection = window.getSelection();
selection.removeAllRanges(); 
selection.addRange(range); //then we add it to the end.
currentPage = newPage;
}

function showMessage(message, callback) {
    const modal = document.getElementById("message-modal");
    const text = document.getElementById("message-text");
    text.textContent = message;
    modal.classList.remove("hidden");
    document.getElementById("message-ok").onclick = () => {
    modal.classList.add("hidden");
    if (callback) callback();
};
}

function showInput(promptText, callback) {
    const modal = document.getElementById("input-modal");
    const promptEl = document.getElementById("input-prompt");
    const input = document.getElementById("input-value");
    promptEl.textContent = promptText;
    input.value = "";
    modal.classList.remove("hidden");
    input.focus();
    document.getElementById("input-confirm").onclick = () => {
    modal.classList.add("hidden");
    callback(input.value);
};

document.getElementById("input-cancel").onclick = () => modal.classList.add("hidden");
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
        const text = Array.from(editorContainer.querySelectorAll(".page")).map(p => p.innerText).join("\n\n");
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
        showInput("Enter title", title => {
        showInput("Enter Author", author => {
        const fullHtml = `
        <html>
        <head>
        <title>${title}</title>
        <meta name="author" content="${author}">                         
        <style>.page { page-break-after: always; }
        </style>                     
        </head>                     
        <body>
        ${Array.from(editorContainer.querySelectorAll(".page")).map(p =>`<div class="page">${p.innerHTML}</div>`).join('')}                     </body>                     </html>
        `;
        const previewWin = window.open();
        previewWin.document.open();
        previewWin.document.write(fullHtml);
        previewWin.document.close();
    });
    });
    }
    exportDoc() {
    showInput("Enter title", title => {
    showInput("Enter Author", author => {
    const fullHtml = `                    
    <html>                     
    <head>                         
    <title>${title}</title>                         
    <meta name="author" content="${author}">                         
    <style>.page { page-break-after: always; }</style>
    </head>                     
    <body>
    ${Array.from(editorContainer.querySelectorAll(".page")).map(p =>`<div class="page">${p.innerHTML}</div>`).join('')}                     </body>                     </html>
    `;
    //we create a new binary large object of the html content. create an objecturl of it then we click it to automatically download.
    const blob = new Blob([fullHtml], { type: "application/msword" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${title}.doc`;
    link.click();
    });
    });
    }
    exportPDF() {
    showInput("Enter title", title => {
    showInput("Enter Author", author => {
        const pages = Array.from(editorContainer.querySelectorAll(".page"));
        if (typeof html2pdf !== "undefined") {
        const combined = document.createElement("div");
        pages.forEach(p => {
        const clone = p.cloneNode(true);
        clone.style.marginBottom = "20px";
        clone.style.pageBreakAfter = "always";
        combined.appendChild(clone);
    });
   const opt = { 
    filename: `${title || "document"}.pdf`, 
    jsPDF: { 
        unit: "mm", 
        format: "a4", 
        orientation: "portrait" 
    } }; 

    html2pdf() 
    .set(opt) 
    .from(combined) 
    .toPdf() 
    .get("pdf") 
    .then(function (pdf) { 
        pdf.setProperties({ 
            title: title || "Untitled", 
            author: author || "Unknown" 
        }); }) .save(); 
    } else { 
        showMessage("html2pdf.js not loaded"); }
    });
    });
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
    orderedList() { 
        restoreSelection();
        this.doc.apply("insertOrderedList"); 
    }
    unorderedList() { 
        restoreSelection();
        this.doc.apply("insertUnorderedList"); 
    }
    indent() { this.doc.apply("indent"); }
    outdent() { this.doc.apply("outdent"); }
    }
    
    let savedRange = null;
    function saveSelection() {
    const sel = window.getSelection();
    if (sel.rangeCount > 0) {
        savedRange = sel.getRangeAt(0);
    }
    }
    function restoreSelection() {
        if (savedRange) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(savedRange);
    }
    }

class Insert {
    constructor(doc) { this.doc = doc; }
    insertLink() {
        saveSelection();
        showInput("Enter URL", url => {
            if (!url) return;
            url = url.trim();
            if (!/^https?:\/\//i.test(url)) {
                url = 'https://' + url;
            }
            restoreSelection();
            this.doc.apply("createLink", url);
            checkPageOverflow(currentPage);
        });
    }

    insertImage() {
    saveSelection();
    showInput("Enter Image URL", url => {
    if (url) {
        restoreSelection();
        const html = `<img src="${url}" style="max-width:100%; display:block;">`;
        this.doc.apply("insertHTML", html);
        checkPageOverflow(currentPage);
    }
    });
    }
    insertLocalImage() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.onchange = () => {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            restoreSelection();
            const html = `<img src="${e.target.result}" style="max-width:100%; display:block;">`;
            this.doc.apply("insertHTML", html);
            checkPageOverflow(currentPage);
        };
        reader.readAsDataURL(file);
        };
        input.click();
    }
    insertTable() {
    saveSelection();
    showInput("Enter number of rows", rows => {
    showInput("Enter number of columns", cols => {
        restoreSelection();
        let table = "<table style='border:1px solid black;border-collapse:collapse;width:100%;'>";
        for (let r = 0; r < rows; r++) {
            table += "<tr>";
            for (let c = 0; c < cols; c++) {
                table += "<td style='border:1px solid black;padding:5px;'></td>";
            }
            table += "</tr>";
        }
        table += "</table><br/>";
        this.doc.apply("insertHTML", table);
        checkPageOverflow(currentPage);
        });
    });
    }
}

const doc = new WordDoc();
const text = new Text(doc);
const list = new List(doc);
const insert = new Insert(doc);

document.querySelectorAll("[data-command]").forEach(btn => {
    btn.addEventListener("click", () => {
        const cmd = btn.dataset.command;
        doc.apply(cmd);
    });
});

document.getElementById("formatBlock").addEventListener("change", e => {
    doc.apply("formatBlock", `<${e.target.value.toUpperCase()}>`);
});
document.getElementById("font-size").addEventListener("change", e => text.textSize(e.target.value));
document.getElementById("fontFamily").addEventListener("change", e => text.textFont(e.target.value));
document.getElementById("textColor").addEventListener("change", e => text.textColor(e.target.value));
document.getElementById("highlight").addEventListener("change", e => text.textHighlight(e.target.value));

document.getElementById("find-replace").addEventListener("click", () => {
    document.getElementById("find-replace-modal").classList.remove("hidden");
});
document.getElementById("replace-btn").addEventListener("click", () => {
    const find = document.getElementById("find-text").value;
    const replace = document.getElementById("replace-text").value;
    doc.findReplace(find, replace);
    document.getElementById("find-replace-modal").classList.add("hidden");
});
document.getElementById("find-replace-cancel").addEventListener("click", () => {
document.getElementById("find-replace-modal").classList.add("hidden");
});

document.getElementById("clear-format").addEventListener("click", () => doc.clearFormat());
document.getElementById("reset-editor").addEventListener("click", () => doc.resetEditor());
document.getElementById("copy-plain").addEventListener("click", () => doc.copyText());
document.getElementById("preview").addEventListener("click", () => doc.preview());
document.getElementById("export-doc").addEventListener("click", () => doc.exportDoc());
document.getElementById("export-pdf").addEventListener("click", () => doc.exportPDF());

document.getElementById("insert-link").addEventListener("click", () => insert.insertLink());
document.getElementById("insert-image").addEventListener("click", () => insert.insertImage());
document.getElementById("insert-local-image").addEventListener("click", () => insert.insertLocalImage());
document.getElementById("insert-table").addEventListener("click", () => insert.insertTable());

document.querySelectorAll("#lists button").forEach(btn => {
btn.addEventListener("click", () => {
    const cmd = btn.dataset.command;
    if (cmd === "insertOrderedList") list.orderedList();
    else if (cmd === "insertUnorderedList") list.unorderedList();
    else if (cmd === "indent") list.indent();
    else if (cmd === "outdent") list.outdent();
});
});

document.getElementById("toggle-theme").addEventListener("click", () => {
document.body.classList.toggle("dark-mode");
localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
});
if (localStorage.getItem("theme") === "dark") document.body.classList.add("dark-mode");

