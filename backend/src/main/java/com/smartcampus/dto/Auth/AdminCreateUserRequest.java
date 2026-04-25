package com.smartcampus.dto.Auth;

import lombok.Data;

@Data
public class AdminCreateUserRequest {
    private String name;
    private String email;
    private String password;
    private String role;
    private String pictureUrl;
    private Boolean active;
}

