package com.smartcampus.ticketing.dto.request;

import com.smartcampus.ticketing.entity.enums.TicketCategory;
import com.smartcampus.ticketing.entity.enums.TicketPriority;
import com.smartcampus.ticketing.entity.enums.TicketStatus;
import lombok.Data;

@Data
public class TicketFilterRequest {
  private TicketStatus status;
  private TicketCategory category;
  private TicketPriority priority;
  private String location;
  // Add more filters as needed
}