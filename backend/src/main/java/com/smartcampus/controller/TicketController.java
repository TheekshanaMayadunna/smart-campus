package com.smartcampus.controller;

import com.smartcampus.dto.ResolutionRequest;
import com.smartcampus.dto.TicketRequestDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {
    private final TicketService ticketService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> create(@ModelAttribute TicketRequestDTO request, Authentication authentication) {
        try {
            User actor = currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(ticketService.createTicket(actor, request)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        User actor = currentUser(authentication);
        List<?> data = ticketService.listForUser(actor)
                .stream()
                .map(ticketService::toTicketResponseDTO)
                .toList();
        return ResponseEntity.ok(data);
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<?> assign(@PathVariable Long id,
                                    @RequestBody Map<String, Long> request,
                                    Authentication authentication) {
        try {
            User actor = currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(ticketService.assignTechnician(id, request.get("technicianId"), actor)));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody ResolutionRequest request,
                                          Authentication authentication) {
        try {
            User actor = currentUser(authentication);
            return ResponseEntity.ok(ticketService.toTicketResponseDTO(ticketService.updateStatus(id, request, actor)));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTicket(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = currentUser(authentication);
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
    public ResponseEntity<?> downloadResolvedTicketPdf(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = currentUser(authentication);
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

    private User currentUser(Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Unauthorized"));
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) return null;
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oUser = oauthToken.getPrincipal();
            return oUser.getAttribute("email");
        }
        if (authentication.getPrincipal() instanceof OAuth2User oUser) {
            return oUser.getAttribute("email");
        }
        return authentication.getName();
    }
}
