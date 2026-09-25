const ALLOWED = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "S", "STRIKE", "A",
  "UL", "OL", "LI", "H1", "H2", "H3", "BLOCKQUOTE", "PRE", "CODE",
]);

/**
 * Reduce pasted HTML (from Google Docs, websites, …) to the tags the editor
 * supports, dropping styles, classes, scripts and every attribute but href.
 */
export function cleanPastedHtml(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node) => {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
        return;
      }
      if (child.nodeType !== Node.ELEMENT_NODE) return;

      walk(child);

      if (["SCRIPT", "STYLE", "META", "LINK", "TITLE"].includes(child.nodeName)) {
        child.remove();
        return;
      }

      if (!ALLOWED.has(child.nodeName)) {
        // Unwrap: keep the text/children, drop the element itself.
        const isBlock = ["DIV", "SECTION", "ARTICLE", "H4", "H5", "H6"].includes(child.nodeName);
        const frag = doc.createDocumentFragment();
        while (child.firstChild) frag.appendChild(child.firstChild);
        if (isBlock) {
          const p = doc.createElement("p");
          p.appendChild(frag);
          child.replaceWith(p);
        } else {
          child.replaceWith(frag);
        }
        return;
      }

      [...child.attributes].forEach((attr) => {
        const keep =
          child.nodeName === "A" &&
          attr.name === "href" &&
          /^(https?:|mailto:)/i.test(attr.value.trim());
        if (!keep) child.removeAttribute(attr.name);
      });
      if (child.nodeName === "A") {
        child.setAttribute("target", "_blank");
        child.setAttribute("rel", "noopener noreferrer");
      }
    });
  };

  walk(doc.body);
  return doc.body.innerHTML;
}
