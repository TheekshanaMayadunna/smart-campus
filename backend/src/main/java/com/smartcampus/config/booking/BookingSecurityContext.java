package com.smartcampus.config.booking;

import com.smartcampus.model.Auth.User;
import com.smartcampus.repository.Auth.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class BookingSecurityContext {
    private final UserRepository userRepository;

    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found");
        }

        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }

        String email = resolveEmail(principal);
        if (email == null || email.isBlank()) {
            throw new IllegalStateException("Unable to resolve authenticated user");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalStateException("Authenticated user not found in database: " + email));
    }

    public void requireAdmin(User user) {
        if (user == null || user.getRole() == null || !"ADMIN".equalsIgnoreCase(user.getRole())) {
            throw new IllegalStateException("Forbidden: Admins only");
        }
    }

    private String resolveEmail(Object principal) {
        if (principal instanceof UserDetails userDetails) {
            return userDetails.getUsername();
        }
        if (principal instanceof OAuth2User oauth2User) {
            Object emailAttr = oauth2User.getAttribute("email");
            return emailAttr == null ? null : emailAttr.toString();
        }
        if (principal instanceof String value && !"anonymousUser".equals(value)) {
            return value;
        }
        return null;
    }
}
