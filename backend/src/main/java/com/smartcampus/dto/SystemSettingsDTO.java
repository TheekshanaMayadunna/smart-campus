package com.smartcampus.dto;

import lombok.Data;

@Data
public class SystemSettingsDTO {
    private String campusName;
    private String supportEmail;
    private String timezone;
    private boolean allowPublicSignup;
    private boolean maintenanceMode;
}
