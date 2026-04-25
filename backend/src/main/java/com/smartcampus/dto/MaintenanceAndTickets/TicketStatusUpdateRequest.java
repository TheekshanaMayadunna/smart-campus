package com.smartcampus.dto.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class TicketStatusUpdateRequest {
    private String status;
    private String resolutionNotes;
    private String rejectionReason;
}
