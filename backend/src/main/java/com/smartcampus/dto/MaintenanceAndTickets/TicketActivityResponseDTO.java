package com.smartcampus.dto.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TicketActivityResponseDTO {
    private Long id;
    private Long actorUserId;
    private String actorName;
    private String actorRole;
    private String activityType;
    private String oldValue;
    private String newValue;
    private String description;
    private LocalDateTime createdAt;
}
