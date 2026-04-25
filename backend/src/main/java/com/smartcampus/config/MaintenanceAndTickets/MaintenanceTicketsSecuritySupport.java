package com.smartcampus.config.MaintenanceAndTickets;

import com.smartcampus.model.Auth.User;
import com.smartcampus.repository.Auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class MaintenanceTicketsSecuritySupport {
    private final UserRepository userRepository;

    public User currentUser(Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Unauthorized");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Unauthorized"));
        requireAnyRole(user, "USER", "TECHNICIAN", "ADMIN", "STAFF");
        return user;
    }

    public boolean hasAnyRole(User user, String... roles) {
        if (user == null || user.getRole() == null) {
            return false;
        }
        String actualRole = user.getRole().trim().toUpperCase(Locale.ROOT);
        return Arrays.stream(roles)
                .map(role -> role == null ? "" : role.trim().toUpperCase(Locale.ROOT))
                .anyMatch(actualRole::equals);
    }

    public void requireAnyRole(User user, String... roles) {
        if (!hasAnyRole(user, roles)) {
            throw new IllegalArgumentException("Forbidden");
        }
    }

    public boolean canCreateTicket(User user) {
        return hasAnyRole(user, "USER", "TECHNICIAN", "ADMIN");
    }

    public boolean canViewAllTickets(User user) {
        return hasAnyRole(user, "ADMIN", "STAFF");
    }

    public boolean canUploadAttachments(User user) {
        return hasAnyRole(user, "USER", "TECHNICIAN", "ADMIN");
    }

    public boolean canAssignTechnician(User user) {
        return hasAnyRole(user, "ADMIN");
    }

    public boolean canUpdateTicketStatus(User user) {
        return hasAnyRole(user, "TECHNICIAN", "ADMIN");
    }

    public boolean canAddResolutionNotes(User user) {
        return hasAnyRole(user, "TECHNICIAN", "ADMIN");
    }

    public boolean canRejectTicket(User user) {
        return hasAnyRole(user, "ADMIN");
    }

    public boolean canCloseTicket(User user) {
        return hasAnyRole(user, "ADMIN");
    }

    public boolean canComment(User user) {
        return hasAnyRole(user, "USER", "TECHNICIAN", "ADMIN");
    }

    public boolean canModerateComments(User user) {
        return hasAnyRole(user, "ADMIN");
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) {
            return null;
        }
        if (authentication instanceof OAuth2AuthenticationToken oauthToken) {
            OAuth2User oAuth2User = oauthToken.getPrincipal();
            return oAuth2User.getAttribute("email");
        }
        if (authentication.getPrincipal() instanceof OAuth2User oAuth2User) {
            return oAuth2User.getAttribute("email");
        }
        return authentication.getName();
    }
}
