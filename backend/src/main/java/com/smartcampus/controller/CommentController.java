package com.smartcampus.controller;

import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Comment;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.service.TicketService;
import lombok.RequiredArgsConstructor;
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
public class CommentController {
    private final TicketService ticketService;
    private final UserRepository userRepository;

    @GetMapping("/{id}/comments")
    public ResponseEntity<?> listComments(@PathVariable Long id, Authentication authentication) {
        try {
            User actor = currentUser(authentication);
            List<Map<String, Object>> comments = ticketService.listComments(id, actor).stream()
                    .map(ticketService::toCommentResponse)
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
            User actor = currentUser(authentication);
            Comment comment = ticketService.addComment(id, payload.get("content"), actor);
            return ResponseEntity.ok(ticketService.toCommentResponse(comment));
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
            User actor = currentUser(authentication);
            Comment comment = ticketService.updateComment(commentId, payload.get("content"), actor);
            return ResponseEntity.ok(ticketService.toCommentResponse(comment));
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
            User actor = currentUser(authentication);
            ticketService.deleteComment(commentId, actor);
            return ResponseEntity.ok(Map.of("message", "Comment deleted"));
        } catch (IllegalArgumentException ex) {
            if ("Forbidden".equalsIgnoreCase(ex.getMessage()) || "Unauthorized".equalsIgnoreCase(ex.getMessage())) {
                return ResponseEntity.status(403).body(ex.getMessage());
            }
            return ResponseEntity.badRequest().body(ex.getMessage());
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
