package com.smartcampus.auth;

import com.smartcampus.ticketing.entity.UserEntity;
import com.smartcampus.ticketing.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AuthDataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUser(1L, "admin", "Admin@123", "System", "Admin", "admin@smartcampus.local", "ADMIN");
        seedUser(2L, "technician", "Tech@123", "Campus", "Technician", "technician@smartcampus.local", "TECHNICIAN");
        seedUser(3L, "student", "Student@123", "Student", "User", "student@smartcampus.local", "STUDENT");
    }

    private void seedUser(Long userId, String username, String rawPassword, String firstName, String lastName, String email, String role) {
        if (userRepository.existsByUsername(username)) {
            return;
        }

        userRepository.save(UserEntity.builder()
            .userId(userId)
            .username(username)
            .passwordHash(passwordEncoder.encode(rawPassword))
            .firstName(firstName)
            .lastName(lastName)
            .email(email)
            .role(role)
            .isActive(true)
            .build());
    }
}
