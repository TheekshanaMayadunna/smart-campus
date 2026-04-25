package com.smartcampus.auth;

import com.smartcampus.auth.dto.AuthResponse;
import com.smartcampus.auth.dto.LoginRequest;
import com.smartcampus.auth.dto.UserResponse;
import com.smartcampus.ticketing.entity.UserEntity;
import com.smartcampus.ticketing.exception.UnauthorizedException;
import com.smartcampus.ticketing.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    public static final String SESSION_USER_ID = "AUTH_USER_ID";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthResponse login(LoginRequest request, HttpSession session) {
        UserEntity user = userRepository.findByUsername(request.getUsername())
            .orElseThrow(() -> new UnauthorizedException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid username or password");
        }

        session.setAttribute(SESSION_USER_ID, user.getUserId());
        return AuthResponse.builder()
            .message("Login successful")
            .user(UserResponse.fromEntity(user))
            .build();
    }

    public UserEntity getCurrentUser(HttpSession session) {
        Object userId = session.getAttribute(SESSION_USER_ID);
        if (userId == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return userRepository.findById((Long) userId)
            .orElseThrow(() -> new UnauthorizedException("Not authenticated"));
    }

    public AuthResponse me(HttpSession session) {
        return AuthResponse.builder()
            .message("Current user")
            .user(UserResponse.fromEntity(getCurrentUser(session)))
            .build();
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }
}
