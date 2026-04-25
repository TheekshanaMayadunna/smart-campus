package com.smartcampus.service.MaintenanceAndTickets;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.smartcampus.model.MaintenanceAndTickets.Ticket;
import com.smartcampus.model.MaintenanceAndTickets.TicketComment;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Builds a simple PDF summary for a resolved/closed support ticket (admin export).
 */
public final class TicketPdfBuilder {

    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private TicketPdfBuilder() {
    }

    public static byte[] build(Ticket ticket, List<TicketComment> comments) throws DocumentException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 40, 40, 40, 40);
        PdfWriter.getInstance(document, out);
        document.open();

        Color headerColor = new Color(0, 102, 153);
        Font titleFont = new Font(Font.HELVETICA, 16, Font.BOLD, headerColor);
        Font labelFont = new Font(Font.HELVETICA, 10, Font.BOLD, Color.DARK_GRAY);
        Font bodyFont = new Font(Font.HELVETICA, 10, Font.NORMAL, Color.BLACK);

        String headingCode = ticket.getTicketCode() == null || ticket.getTicketCode().isBlank()
                ? "#" + ticket.getId()
                : ticket.getTicketCode();
        Paragraph title = new Paragraph("Resolved ticket report " + headingCode, titleFont);
        title.setSpacingAfter(12);
        document.add(title);

        PdfPTable grid = new PdfPTable(2);
        grid.setWidthPercentage(100);
        grid.setWidths(new float[]{1.2f, 3.2f});

        addRow(grid, "Status", pdfSafe(ticket.getStatus() != null ? ticket.getStatus().name() : ""), labelFont, bodyFont);
        addRow(grid, "Category", pdfSafe(ticket.getCategory()), labelFont, bodyFont);
        addRow(grid, "Resource / location", pdfSafe(ticket.getLocationText()), labelFont, bodyFont);
        addRow(grid, "Priority", pdfSafe(ticket.getPriority()), labelFont, bodyFont);
        addRow(grid, "Preferred contact", pdfSafe(ticket.getPreferredContact()), labelFont, bodyFont);
        addRow(grid, "Created", ticket.getCreatedAt() != null ? FMT.format(ticket.getCreatedAt()) : "", labelFont, bodyFont);
        addRow(grid, "Updated", ticket.getUpdatedAt() != null ? FMT.format(ticket.getUpdatedAt()) : "", labelFont, bodyFont);
        if (ticket.getReportedBy() != null) {
            addRow(grid, "Reporter", pdfSafe(ticket.getReportedBy().getName()) + " (" + pdfSafe(ticket.getReportedBy().getEmail()) + ")", labelFont, bodyFont);
        }
        if (ticket.getAssignedTechnician() != null) {
            addRow(grid, "Assigned technician", pdfSafe(ticket.getAssignedTechnician().getName()), labelFont, bodyFont);
        }
        addRow(grid, "Description", pdfSafe(ticket.getDescription()), labelFont, bodyFont);
        addRow(grid, "Resolution notes", pdfSafe(ticket.getResolutionNotes()), labelFont, bodyFont);
        if (ticket.getRejectionReason() != null && !ticket.getRejectionReason().isBlank()) {
            addRow(grid, "Rejection reason", pdfSafe(ticket.getRejectionReason()), labelFont, bodyFont);
        }

        document.add(grid);

        document.add(new Paragraph(" ", bodyFont));
        Paragraph cTitle = new Paragraph("Comments", new Font(Font.HELVETICA, 12, Font.BOLD, headerColor));
        cTitle.setSpacingAfter(6);
        document.add(cTitle);

        if (comments == null || comments.isEmpty()) {
            document.add(new Paragraph("No comments on this ticket.", bodyFont));
        } else {
            for (TicketComment c : comments) {
                String who = c.getUser() != null ? pdfSafe(c.getUser().getName()) : "Unknown";
                String when = c.getCreatedAt() != null ? FMT.format(c.getCreatedAt()) : "";
                document.add(new Paragraph(pdfSafe(who + " - " + when), labelFont));
                document.add(new Paragraph(pdfSafe(c.getCommentText()), bodyFont));
                document.add(new Paragraph(" ", bodyFont));
            }
        }

        document.close();
        return out.toByteArray();
    }

    private static void addRow(PdfPTable grid, String label, String value, Font labelFont, Font bodyFont) {
        PdfPCell l = new PdfPCell(new Phrase(label, labelFont));
        l.setBackgroundColor(new Color(245, 248, 252));
        l.setPadding(6);
        l.setVerticalAlignment(Element.ALIGN_TOP);
        grid.addCell(l);

        PdfPCell v = new PdfPCell(new Phrase(value == null ? "" : value, bodyFont));
        v.setPadding(6);
        v.setVerticalAlignment(Element.ALIGN_TOP);
        grid.addCell(v);
    }

    private static String safe(String s) {
        return s == null ? "" : s;
    }

    /**
     * Helvetica in OpenPDF cannot render arbitrary Unicode; non-ASCII text otherwise causes DocumentException.
     */
    private static String pdfSafe(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        StringBuilder b = new StringBuilder(Math.min(s.length() * 2, 16000));
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == '\n' || c == '\r' || c == '\t') {
                b.append(c);
            } else if (c >= 32 && c <= 126) {
                b.append(c);
            } else {
                b.append(' ');
            }
        }
        return b.toString();
    }
}
