package com.smartcampus.dto.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
public class TicketResponseDTO {
    private Long id;
    private String ticketCode;
    private Long resourceId;
    private String locationText;
    private String category;
    private String description;
    private String priority;
    private String preferredContact;
    private String status;
    private String rejectionReason;
    private String resolutionNotes;
    private Long reporterId;
    private String reporterName;
    private Long assignedTechnicianId;
    private String assignedTechnicianName;
    private boolean slaBreached;
    private boolean firstResponseBreached;
    private boolean resolutionBreached;
    private String slaState;
    private List<String> attachments;
    private List<TicketAttachmentResponseDTO> attachmentDetails;
    private List<TicketActivityResponseDTO> activityTimeline;
    private LocalDateTime firstResponseAt;
    private LocalDateTime resolvedAt;
    private LocalDateTime closedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
