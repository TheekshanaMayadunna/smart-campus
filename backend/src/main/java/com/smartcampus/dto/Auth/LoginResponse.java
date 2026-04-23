package com.smartcampus.dto.Auth;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponse {
    private Long id;
    private String name;
    private String email;
    private String studentId;
    private String role;
    private String pictureUrl;
    private boolean googleLogin;
}
