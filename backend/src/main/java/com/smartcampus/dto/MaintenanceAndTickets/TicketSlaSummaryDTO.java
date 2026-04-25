package com.smartcampus.dto.MaintenanceAndTickets;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class TicketSlaSummaryDTO {
    private boolean breached;
    private String priorityBand;
    private long targetHours;
    private LocalDateTime deadlineAt;
    private long elapsedHours;
    private String statusLabel;
    private long firstResponseTargetMinutes;
    private long resolutionTargetMinutes;
    private LocalDateTime firstResponseDeadlineAt;
    private LocalDateTime resolutionDeadlineAt;
    private boolean firstResponseBreached;
    private boolean resolutionBreached;
    private Long firstResponseRemainingMinutes;
    private Long resolutionRemainingMinutes;
    private String slaState;
}
