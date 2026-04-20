package com.smartcampus.ticketing.dto.response;

import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import com.smartcampus.ticketing.entity.enums.TicketCategory;
import com.smartcampus.ticketing.entity.enums.TicketPriority;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TicketResponse {
  private Long ticketId;
  private String location;
  private TicketCategory category;
  private String description;
  private TicketPriority priority;
  private TicketStatus status;
  private String preferredContact;
  private Long reportedById;
  private String reportedByName;
  private Long assignedToId;
  private String assignedToName;
  private Integer attachmentCount;
  private Integer commentCount;
  private String rejectionReason;
  private String resolutionNotes;
  private LocalDateTime firstResponseAt;
  private LocalDateTime resolvedAt;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static TicketResponse fromEntity(IncidentTicketEntity entity) {
    TicketResponse response = new TicketResponse();
    response.setTicketId(entity.getTicketId());
    response.setLocation(entity.getLocation());
    response.setCategory(entity.getCategory());
    response.setDescription(entity.getDescription());
    response.setPriority(entity.getPriority());
    response.setStatus(entity.getStatus());
    response.setPreferredContact(entity.getPreferredContact());
    if (entity.getReportedBy() != null) {
      response.setReportedById(entity.getReportedBy().getUserId());
      response.setReportedByName(entity.getReportedBy().getFirstName() + " " + entity.getReportedBy().getLastName());
    }
    if (entity.getAssignedTo() != null) {
      response.setAssignedToId(entity.getAssignedTo().getUserId());
      response.setAssignedToName(entity.getAssignedTo().getFirstName() + " " + entity.getAssignedTo().getLastName());
    }
    response.setAttachmentCount(0); // TODO: implement attachments
    response.setCommentCount(0); // TODO: implement comments
    response.setRejectionReason(entity.getRejectionReason());
    response.setResolutionNotes(entity.getResolutionNotes());
    response.setFirstResponseAt(entity.getFirstResponseAt());
    response.setResolvedAt(entity.getResolvedAt());
    response.setCreatedAt(entity.getCreatedAt());
    response.setUpdatedAt(entity.getUpdatedAt());
    return response;
  }
}