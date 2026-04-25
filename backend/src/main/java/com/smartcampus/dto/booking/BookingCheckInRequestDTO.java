package com.smartcampus.dto.booking;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class BookingCheckInRequestDTO {
    @NotBlank(message = "Check-in token is required")
    private String token;
}
