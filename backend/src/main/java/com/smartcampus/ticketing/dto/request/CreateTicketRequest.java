package com.smartcampus.ticketing.dto.request;

import com.smartcampus.ticketing.entity.enums.TicketCategory;
import com.smartcampus.ticketing.entity.enums.TicketPriority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateTicketRequest {
  private Long resourceId;
  @NotBlank
  private String location;
  @NotNull
  private TicketCategory category;
  @NotBlank
  @Size(max = 2000)
  private String description;
  @NotNull
  private TicketPriority priority;
  @NotBlank
  private String preferredContact;
}