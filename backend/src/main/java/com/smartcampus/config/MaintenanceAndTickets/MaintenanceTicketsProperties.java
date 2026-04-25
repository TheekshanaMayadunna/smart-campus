package com.smartcampus.config.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "smartcampus.maintenance.tickets")
@Getter
@Setter
public class MaintenanceTicketsProperties {
    private String codePrefix = "TCK";
    private String uploadDir = "uploads/tickets";
    private int maxAttachments = 3;
    private long maxAttachmentSizeBytes = 5 * 1024 * 1024;
}
