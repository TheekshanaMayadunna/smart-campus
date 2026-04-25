package com.smartcampus.auth.dto;

import com.smartcampus.ticketing.entity.UserEntity;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserResponse {
    private Long userId;
    private String username;
    private String fullName;
    private String email;
    private String role;

    public static UserResponse fromEntity(UserEntity user) {
        return UserResponse.builder()
            .userId(user.getUserId())
            .username(user.getUsername())
            .fullName(user.getFirstName() + " " + user.getLastName())
            .email(user.getEmail())
            .role(user.getRole())
            .build();
    }
}
