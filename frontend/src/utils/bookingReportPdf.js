import { drawColorfulFooter, drawColorfulHeader, safeFileName } from "./pdfTheme.js";

function formatTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

export async function downloadBookingReportPdf({ booking }) {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const title = "Booking Report";
  const generatedAt = new Date().toLocaleString();

  const headerHeight = drawColorfulHeader(doc, { title, subtitle: `Generated: ${generatedAt}` });
  const footerHeight = drawColorfulFooter(doc, { pageNumber: 1 });

  const rows = [
    ["Booking ID", booking?.id ? `#${booking.id}` : "—"],
    ["Resource Name", booking?.resourceName || "—"],
    ["Date", booking?.date || "—"],
    ["Start Time", formatTime(booking?.startTime) || "—"],
    ["End Time", formatTime(booking?.endTime) || "—"],
    ["Purpose", booking?.purpose || "—"],
    ["Expected Attendees", booking?.expectedAttendees ?? "—"],
    ["Status", booking?.status || "—"],
  ];

  autoTable(doc, {
    margin: { top: headerHeight + 10, bottom: footerHeight + 8, left: 14, right: 14 },
    didDrawPage: () => {
      const currentPage = doc.internal.getCurrentPageInfo().pageNumber;
      drawColorfulHeader(doc, { title, subtitle: `Generated: ${generatedAt}` });
      drawColorfulFooter(doc, { pageNumber: currentPage });
    },
    head: [["Booking Details", "Value"]],
    body: rows,
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [37, 99, 235] },
    columnStyles: {
      0: { cellWidth: 55, fontStyle: "bold" },
      1: { cellWidth: "auto" },
    },
    theme: "grid",
  });

  const pageCount = doc.internal.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    drawColorfulFooter(doc, { pageNumber: page, pageCount });
  }

  const base = safeFileName(`booking-${booking?.id || "report"}`);
  doc.save(`${base}.pdf`);
}
