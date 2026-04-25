package com.smartcampus.dto.Auth;

import lombok.Data;

@Data
public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private String pictureUrl;
}
