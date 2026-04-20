package com.smartcampus.ticketing.event;

import com.smartcampus.ticketing.entity.IncidentTicketEntity;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TicketCreatedEvent {
  private IncidentTicketEntity ticket;
  private Long reporterId;
}