export function safeFileName(value) {
  return String(value || "")
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
}

export function addSectionTitle(doc, title, y) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 14, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  return y + 6;
}

export function addKeyValues(doc, entries, y) {
  const leftX = 14;
  const labelWidth = 44;
  const valueX = leftX + labelWidth;
  const maxWidth = 180;
  const lineHeight = 5;

  doc.setFontSize(10);
  for (const { label, value } of entries) {
    doc.setFont("helvetica", "bold");
    doc.text(`${label}:`, leftX, y);
    doc.setFont("helvetica", "normal");
    const text = value == null || value === "" ? "—" : String(value);
    const lines = doc.splitTextToSize(text, maxWidth);
    doc.text(lines, valueX, y);
    y += Math.max(1, lines.length) * lineHeight;
  }
  return y + 2;
}

export function drawColorfulHeader(doc, { title, subtitle }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const headerHeight = 22;

  doc.setFillColor(12, 74, 203);
  doc.rect(0, 0, pageWidth, headerHeight, "F");

  doc.setFillColor(37, 99, 235);
  doc.rect(0, headerHeight - 9, pageWidth, 4.5, "F");

  doc.setFillColor(56, 189, 248);
  doc.rect(0, headerHeight - 4.5, pageWidth, 4.5, "F");

  doc.setFillColor(14, 165, 233);
  doc.triangle(pageWidth - 55, 0, pageWidth, 0, pageWidth, headerHeight, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Campus Velora", 14, 9);

  doc.setFontSize(14);
  doc.text(title, 14, 17);

  if (subtitle) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(226, 232, 240);
    doc.text(subtitle, pageWidth - 14, 9, { align: "right" });
  }

  doc.setTextColor(16, 35, 62);
  doc.setFont("helvetica", "normal");
  return headerHeight;
}

export function drawColorfulFooter(doc, { pageNumber, pageCount }) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const footerHeight = 16;
  const y = pageHeight - footerHeight;

  doc.setFillColor(239, 246, 255);
  doc.rect(0, y, pageWidth, footerHeight, "F");

  doc.setFillColor(219, 234, 254);
  doc.rect(0, y, pageWidth, 5, "F");

  doc.setFillColor(147, 197, 253);
  doc.rect(0, y + 5, pageWidth, 4, "F");

  doc.setFillColor(59, 130, 246);
  doc.rect(0, y + 9, pageWidth, 2, "F");

  doc.setFillColor(37, 99, 235);
  doc.rect(0, y + 11, pageWidth, 5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Page ${pageNumber}${pageCount ? ` of ${pageCount}` : ""}`, pageWidth - 14, y + 13, { align: "right" });

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Campus Documentation", 14, y + 13);

  doc.setTextColor(16, 35, 62);
  doc.setFont("helvetica", "normal");
  return footerHeight;
}

