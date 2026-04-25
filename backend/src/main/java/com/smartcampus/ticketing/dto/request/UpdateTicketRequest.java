package com.smartcampus.ticketing.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateTicketRequest {
  private Long resourceId;
  private String location;
  @NotBlank
  private String category;
  @NotBlank
  @Size(min = 10, max = 2000)
  private String description;
  @NotBlank
  private String priority;
  @NotBlank
  private String preferredContact;
}
