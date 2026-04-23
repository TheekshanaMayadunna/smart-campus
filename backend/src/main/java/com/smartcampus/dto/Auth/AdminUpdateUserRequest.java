package com.smartcampus.dto.Auth;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String name;
    private String email;
    private String role;
    private String pictureUrl;
    private String password;
}
