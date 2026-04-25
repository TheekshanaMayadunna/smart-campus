package com.smartcampus.dto.booking;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingRejectRequestDTO {
    @NotBlank(message = "Rejection reason is required")
    @Size(max = 500, message = "Rejection reason must be 500 characters or less")
    private String reason;
}
