package com.smartcampus.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class BookingAnalyticsDTO {
    private long totalBookings;
    private long pendingBookings;
    private long approvedBookings;
    private long checkedInBookings;
    private List<BookingPeakHourDTO> peakBookingHours;
}
