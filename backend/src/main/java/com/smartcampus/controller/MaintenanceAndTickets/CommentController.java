package com.smartcampus.controller.MaintenanceAndTickets;

import com.smartcampus.config.MaintenanceAndTickets.MaintenanceTicketsSecuritySupport;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.MaintenanceAndTickets.TicketComment;
import com.smartcampus.service.MaintenanceAndTickets.TicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('USER','TECHNICIAN','ADMIN','STAFF')")
public class CommentController {
    private final TicketService ticketService;
    private final MaintenanceTicketsSecuritySupport securitySupport;

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> listComments(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            List<Map<String, Object>> comments = ticketService.listComments(id, actor).stream()
                    .map(comment -> ticketService.toCommentResponse(comment, actor))
                    .toList();
            return ResponseEntity.ok(comments);
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PostMapping("/{id}/comments")
    public ResponseEntity<?> addComment(@PathVariable Long id,
                                        @RequestBody Map<String, String> payload,
                                        Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            TicketComment comment = ticketService.addComment(id, payload.get("content"), actor);
            return ResponseEntity.ok(ticketService.toCommentResponse(comment, actor));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId,
                                           @RequestBody Map<String, String> payload,
                                           Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            TicketComment comment = ticketService.updateComment(commentId, payload.get("content"), actor);
            return ResponseEntity.ok(ticketService.toCommentResponse(comment, actor));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId, Authentication authentication) {
        try {
            User actor = securitySupport.currentUser(authentication);
            ticketService.deleteComment(commentId, actor);
            return ResponseEntity.ok(Map.of("message", "Comment deleted"));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
        }
    }
}
