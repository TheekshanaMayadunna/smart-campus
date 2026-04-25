package com.smartcampus.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class BookingPeakHourDTO {
    private int hour;
    private long totalBookings;
    private String label;
}
