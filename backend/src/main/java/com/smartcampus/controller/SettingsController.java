package com.smartcampus.controller;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.smartcampus.dto.SystemSettingsDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.SystemSettings;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.SystemSettingsRepository;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SystemSettingsRepository settingsRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getSettings(Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body("Forbidden: Admins only");
        }

        SystemSettings settings = getOrCreateDefaultSettings();
        return ResponseEntity.ok(toDto(settings));
    }

    @PutMapping
    public ResponseEntity<?> updateSettings(@RequestBody SystemSettingsDTO request, Authentication authentication) {
        if (!isAdmin(authentication)) {
            return ResponseEntity.status(403).body("Forbidden: Admins only");
        }

        if (request.getCampusName() == null || request.getCampusName().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Campus name is required");
        }
        if (request.getSupportEmail() == null || request.getSupportEmail().trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Support email is required");
        }

        SystemSettings settings = getOrCreateDefaultSettings();
        settings.setCampusName(request.getCampusName().trim());
        settings.setSupportEmail(request.getSupportEmail().trim());
        settings.setTimezone((request.getTimezone() == null || request.getTimezone().trim().isEmpty())
                ? "Asia/Colombo"
                : request.getTimezone().trim());
        settings.setAllowPublicSignup(request.isAllowPublicSignup());
        settings.setMaintenanceMode(request.isMaintenanceMode());

        settingsRepository.save(settings);
        return ResponseEntity.ok(toDto(settings));
    }

    private SystemSettingsDTO toDto(SystemSettings settings) {
        SystemSettingsDTO dto = new SystemSettingsDTO();
        dto.setCampusName(settings.getCampusName());
        dto.setSupportEmail(settings.getSupportEmail());
        dto.setTimezone(settings.getTimezone());
        dto.setAllowPublicSignup(settings.isAllowPublicSignup());
        dto.setMaintenanceMode(settings.isMaintenanceMode());
        return dto;
    }

    private SystemSettings getOrCreateDefaultSettings() {
        return settingsRepository.findTopByOrderByIdAsc().orElseGet(() -> {
            SystemSettings settings = new SystemSettings();
            settings.setCampusName("Campus Velora");
            settings.setSupportEmail("support@campusvelora.edu");
            settings.setTimezone("Asia/Colombo");
            settings.setAllowPublicSignup(true);
            settings.setMaintenanceMode(false);
            return settingsRepository.save(settings);
        });
    }

    private boolean isAdmin(Authentication authentication) {
        String email = resolveEmail(authentication);
        if (email == null || email.isBlank()) {
            return false;
        }
        Optional<User> userOpt = userRepository.findByEmail(email);
        return userOpt.isPresent() && "ADMIN".equalsIgnoreCase(userOpt.get().getRole());
    }

    private String resolveEmail(Authentication authentication) {
        if (authentication == null) {
            return null;
        }

        if (authentication instanceof OAuth2AuthenticationToken) {
            OAuth2User oUser = ((OAuth2AuthenticationToken) authentication).getPrincipal();
            return oUser.getAttribute("email");
        }

        if (authentication.getPrincipal() instanceof OAuth2User) {
            OAuth2User oUser = (OAuth2User) authentication.getPrincipal();
            return oUser.getAttribute("email");
        }

        return authentication.getName();
    }
}
