package com.smartcampus.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalTime;

@Getter
@Builder
@AllArgsConstructor
public class BookingAvailableSlotDTO {
    private LocalTime startTime;
    private LocalTime endTime;
    private String label;
}
