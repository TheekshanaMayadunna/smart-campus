package com.smartcampus.dto.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;
import org.springframework.web.multipart.MultipartFile;

@Getter
@Setter
public class TicketRequestDTO {
    private Long resourceId;
    private String locationText;
    private String category;
    private String description;
    private String priority;
    private String preferredContact;
    private MultipartFile[] attachments;
}
