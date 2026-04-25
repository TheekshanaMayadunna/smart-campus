package com.smartcampus.controller.MaintenanceAndTickets;

import com.smartcampus.config.MaintenanceAndTickets.MaintenanceTicketsSecuritySupport;
import com.smartcampus.dto.MaintenanceAndTickets.TicketListFilterRequest;
import com.smartcampus.dto.MaintenanceAndTickets.TicketResolutionNotesUpdateRequest;
import com.smartcampus.dto.MaintenanceAndTickets.TicketRequestDTO;
import com.smartcampus.dto.MaintenanceAndTickets.TicketStatusUpdateRequest;
import com.smartcampus.model.Auth.User;
import com.smartcampus.service.MaintenanceAndTickets.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN','STAFF')")
public class TicketController {
    private final TicketService ticketService;
    private final MaintenanceTicketsSecuritySupport securitySupport;

    @PostMapping
    public ResponseEntity<?> create(@ModelAttribute TicketRequestDTO request, Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(ticketService.createTicket(actor, request)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> list(@ModelAttribute TicketListFilterRequest filterRequest,
                                  Authentication authentication) {
        User actor = securitySupport.currentUser(authentication);
        List<?> data = ticketService.listForUser(actor, filterRequest)
                .stream()
                .map(ticketService::toTicketResponseDTO)
                .toList();
        return ResponseEntity.ok(data);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            return ResponseEntity.ok(ticketService.getTicketDetail(id, actor));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadAttachments(@PathVariable Long id,
                                               @RequestParam("attachments") MultipartFile[] attachments,
                                               Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            return ResponseEntity.ok(ticketService.addAttachments(id, attachments, actor));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> assign(@PathVariable Long id,
                                    @RequestBody Map<String, Long> request,
                                    Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(ticketService.assignTechnician(id, request.get("technicianId"), actor)));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody TicketStatusUpdateRequest request,
                                          Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(ticketService.updateStatus(id, request, actor)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/resolution-notes")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<?> updateResolutionNotes(@PathVariable Long id,
                                                   @RequestBody TicketResolutionNotesUpdateRequest request,
                                                   Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(
                    ticketService.updateResolutionNotes(id, request.getResolutionNotes(), actor)));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('TECHNICIAN','ADMIN')")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            ticketService.deleteResolvedTicket(id, actor);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping("/{id}/pdf")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> downloadResolvedTicketPdf(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            byte[] pdf = ticketService.exportResolvedTicketPdf(id, actor);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=ticket-" + id + "-resolved.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(pdf);
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).contentType(MediaType.TEXT_PLAIN).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().contentType(MediaType.TEXT_PLAIN).body(ex.getMessage());
        } catch (IllegalStateException ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .contentType(MediaType.TEXT_PLAIN)
                    .body(ex.getMessage() != null ? ex.getMessage() : "PDF generation failed");
        }
    }
}
