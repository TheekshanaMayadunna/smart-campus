package com.smartcampus.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class BookingConflictCheckResponseDTO {
    private boolean conflict;
    private String message;
    private Integer remainingCapacity;
    private List<BookingAvailableSlotDTO> availableSlots;
}
