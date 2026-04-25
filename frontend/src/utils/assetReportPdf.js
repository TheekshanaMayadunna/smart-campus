import {
  addKeyValues,
  addSectionTitle,
  drawColorfulFooter,
  drawColorfulHeader,
  safeFileName,
} from "./pdfTheme.js";

export async function downloadAssetReportPdf({ resource, assetProfile, inspections }) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const title = "Asset & Inspection Report";
  const generatedAt = new Date().toLocaleString();
  const headerHeight = drawColorfulHeader(doc, { title, subtitle: `Generated: ${generatedAt}` });
  const footerHeight = drawColorfulFooter(doc, { pageNumber: 1 });

  let y = headerHeight + 16;
  y = addSectionTitle(doc, "Resource Details", y);
  y = addKeyValues(doc, [
    { label: "Resource ID", value: resource?.id },
    { label: "Name", value: resource?.name },
    { label: "Type", value: resource?.type },
    { label: "Status", value: resource?.status },
    { label: "Capacity", value: resource?.capacity },
    { label: "Location", value: resource?.location },
    { label: "Availability", value: resource?.availabilityStart && resource?.availabilityEnd ? `${resource.availabilityStart} - ${resource.availabilityEnd}` : "" },
    { label: "Description", value: resource?.description },
  ], y);

  y += 2;
  y = addSectionTitle(doc, "Asset Profile", y);
  y = addKeyValues(doc, [
    { label: "Asset Code", value: assetProfile?.assetCode },
    { label: "Serial Number", value: assetProfile?.serialNumber },
    { label: "Manufacturer", value: assetProfile?.manufacturer },
    { label: "Model Number", value: assetProfile?.modelNumber },
    { label: "Purchase Date", value: assetProfile?.purchaseDate },
    { label: "Warranty Expiry", value: assetProfile?.warrantyExpiryDate },
    { label: "Condition", value: assetProfile?.currentCondition },
    { label: "Inspection Status", value: assetProfile?.inspectionStatus },
    { label: "Last Inspection", value: assetProfile?.lastInspectionDate },
    { label: "Next Inspection", value: assetProfile?.nextInspectionDate },
    { label: "QR Value", value: assetProfile?.qrCodeValue },
    { label: "Notes", value: assetProfile?.notes },
  ], y);

  const tableRows = (Array.isArray(inspections) ? inspections : []).map((r) => [
    r.inspectionDate || "—",
    r.inspectorName || "—",
    r.inspectionStatus || "—",
    r.conditionAtInspection || "—",
    r.remarks || "—",
    r.actionRequired || "—",
    r.nextInspectionDate || "—",
  ]);

  autoTable(doc, {
    margin: { top: headerHeight + 8, bottom: footerHeight + 6, left: 14, right: 14 },
    didDrawPage: () => {
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      drawColorfulHeader(doc, { title, subtitle: `Generated: ${generatedAt}` });
      drawColorfulFooter(doc, { pageNumber: currentPage });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(16, 35, 62);
      doc.text("Inspection History", 14, headerHeight + 6);
      doc.setFont("helvetica", "normal");
    },
    head: [[
      "Date",
      "Inspector",
      "Status",
      "Condition",
      "Remarks",
      "Action Required",
      "Next Date",
    ]],
    body: tableRows.length ? tableRows : [["—", "—", "—", "—", "No inspections found.", "—", "—"]],
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 26 },
      2: { cellWidth: 18 },
      3: { cellWidth: 18 },
      4: { cellWidth: 42 },
      5: { cellWidth: 42 },
      6: { cellWidth: 22 },
    },
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawColorfulFooter(doc, { pageNumber: page, pageCount });
  }

  const fileBase = safeFileName(resource?.name || `resource-${resource?.id || "report"}`);
  doc.save(`${fileBase}-asset-report.pdf`);
}
