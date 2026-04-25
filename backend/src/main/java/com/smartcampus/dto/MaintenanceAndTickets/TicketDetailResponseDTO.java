package com.smartcampus.dto.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
public class TicketDetailResponseDTO {
    private TicketResponseDTO ticket;
    private Map<String, Object> reporter;
    private Map<String, Object> assignedTechnician;
    private List<TicketAttachmentResponseDTO> attachments;
    private List<TicketCommentResponseDTO> comments;
    private List<TicketActivityResponseDTO> timeline;
    private TicketSlaSummaryDTO slaSummary;
}
