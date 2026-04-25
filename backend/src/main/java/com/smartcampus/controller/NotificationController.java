package com.smartcampus.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.NotificationPreferencesDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.service.NotificationService;
import com.smartcampus.service.NotificationService.NotificationPayload;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {
    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> list(Authentication authentication) {
        User currentUser = currentUser(authentication);
        List<NotificationPayload> payload = notificationService.getForUser(currentUser.getId())
                .stream()
                .map(notificationService::toPayload)
                .toList();
        return ResponseEntity.ok(payload);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> unreadCount(Authentication authentication) {
        User currentUser = currentUser(authentication);
        long count = notificationService.unreadCount(currentUser.getId());
        return ResponseEntity.ok(Map.of("count", count));
    }

    @GetMapping("/preferences")
    public ResponseEntity<?> getPreferences(Authentication authentication) {
        User currentUser = currentUser(authentication);
        NotificationPreferencesDTO dto = notificationService.getPreferences(currentUser.getId());
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/preferences")
    public ResponseEntity<?> updatePreferences(@RequestBody NotificationPreferencesDTO request,
            Authentication authentication) {
        User currentUser = currentUser(authentication);
        NotificationPreferencesDTO dto = notificationService.updatePreferences(currentUser.getId(), request);
        return ResponseEntity.ok(dto);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markRead(@PathVariable Long id, Authentication authentication) {
        User currentUser = currentUser(authentication);
        NotificationPayload payload = notificationService.toPayload(notificationService.markRead(id, currentUser.getId()));
        return ResponseEntity.ok(payload);
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllRead(Authentication authentication) {
        User currentUser = currentUser(authentication);
        int updatedCount = notificationService.markAllRead(currentUser.getId());
        return ResponseEntity.ok(Map.of("updated", updatedCount));
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
        if (authentication == null) {
            return null;
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof OAuth2User oauth2User) {
            return oauth2User.getAttribute("email");
        }
        if (principal instanceof String str && !"anonymousUser".equals(str)) {
            return str;
        }
        return null;
    }
}
