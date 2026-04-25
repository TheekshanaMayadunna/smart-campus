package com.smartcampus.controller;

import com.smartcampus.dto.*;
import com.smartcampus.model.ResourceType;
import com.smartcampus.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.awt.Color;

import com.lowagie.text.*;
import com.lowagie.text.pdf.*;

import java.io.ByteArrayOutputStream;
import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService service;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO create(@Valid @RequestBody ResourceRequestDTO dto) {
        return service.create(dto);
    }

    @GetMapping
    public List<ResourceResponseDTO> list(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer minCap,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q
    ) {
        return service.search(type, minCap, location, status, q);
    }

    // PDF Report download (UPDATED - NO ID)
    @GetMapping(value = "/report/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> downloadReportPdf(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) Integer minCap,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q
    ) {

        List<ResourceResponseDTO> list = service.search(type, minCap, location, status, q);

        try {

            ByteArrayOutputStream out = new ByteArrayOutputStream();

            Document document = new Document(PageSize.A4.rotate(), 20, 20, 20, 20);
            PdfWriter.getInstance(document, out);
            document.open();

            // ===== Colors =====
            Color headerColor = new Color(0, 102, 153);
            Color rowAltColor = new Color(230, 240, 250);

            // ===== Title =====
            Font titleFont = new Font(Font.HELVETICA, 18, Font.BOLD, headerColor);

            Paragraph title = new Paragraph("Campus Velora - Resources Report", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(10);

            document.add(title);

            document.add(new Paragraph("Total Records: " + list.size()));
            document.add(new Paragraph(" "));

            //  UPDATED TABLE (6 columns instead of 7)
            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3.5f, 2.2f, 1.5f, 3.0f, 2.0f, 3.0f});

            //  HEADERS (NO ID)
            addHeader(table, "Name", headerColor);
            addHeader(table, "Type", headerColor);
            addHeader(table, "Capacity", headerColor);
            addHeader(table, "Location", headerColor);
            addHeader(table, "Status", headerColor);
            addHeader(table, "Availability", headerColor);

            boolean alternate = false;

            for (ResourceResponseDTO r : list) {

                Color rowColor = alternate ? rowAltColor : Color.WHITE;

                // ✅ REMOVED ID COLUMN
                table.addCell(createCell(safe(r.getName()), rowColor));
                table.addCell(createCell(String.valueOf(r.getType()), rowColor));
                table.addCell(createCell(String.valueOf(r.getCapacity()), rowColor));
                table.addCell(createCell(safe(r.getLocation()), rowColor));
                table.addCell(createCell(safe(r.getStatus()), rowColor));
                table.addCell(createCell(safe(r.getAvailabilityWindows()), rowColor));

                alternate = !alternate;
            }

            document.add(table);

            document.close();

            byte[] pdfBytes = out.toByteArray();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=resources_report.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdfBytes);

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed: " + e.getMessage(), e);
        }
    }

    private void addHeader(PdfPTable table, String text, Color bgColor) {

        Font headFont = new Font(Font.HELVETICA, 12, Font.BOLD, Color.WHITE);

        PdfPCell h = new PdfPCell(new Phrase(text, headFont));

        h.setBackgroundColor(bgColor);
        h.setHorizontalAlignment(Element.ALIGN_CENTER);
        h.setPadding(8);

        table.addCell(h);
    }

    private PdfPCell createCell(String text, Color bgColor) {

        Font cellFont = new Font(Font.HELVETICA, 11);

        PdfPCell cell = new PdfPCell(new Phrase(text, cellFont));

        cell.setBackgroundColor(bgColor);
        cell.setPadding(7);

        return cell;
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    @GetMapping("/{id}")
    public ResourceResponseDTO get(@PathVariable Long id) {
        return service.getById(id);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResourceResponseDTO update(@PathVariable Long id, @Valid @RequestBody ResourceRequestDTO dto) {
        return service.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}