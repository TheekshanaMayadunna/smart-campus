package com.smartcampus.dto.booking;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class BookingQrCodeDTO {
    private Long bookingId;
    private String qrCodeDataUrl;
    private String token;
    private LocalDateTime tokenExpiresAt;
}
