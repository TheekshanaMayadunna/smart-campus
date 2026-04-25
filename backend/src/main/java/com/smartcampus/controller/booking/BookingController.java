package com.smartcampus.controller.booking;

import com.smartcampus.config.booking.BookingSecurityContext;
import com.smartcampus.dto.booking.BookingAnalyticsDTO;
import com.smartcampus.dto.booking.BookingCheckInRequestDTO;
import com.smartcampus.dto.booking.BookingConflictCheckResponseDTO;
import com.smartcampus.dto.booking.BookingCreateRequestDTO;
import com.smartcampus.dto.booking.BookingQrCodeDTO;
import com.smartcampus.dto.booking.BookingRejectRequestDTO;
import com.smartcampus.dto.booking.BookingResponseDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.booking.BookingStatus;
import com.smartcampus.service.booking.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    private final BookingSecurityContext bookingSecurityContext;

    @PostMapping
    public ResponseEntity<BookingResponseDTO> createBooking(@Valid @RequestBody BookingCreateRequestDTO request) {
        User currentUser = bookingSecurityContext.getCurrentUser();
        return ResponseEntity.status(HttpStatus.CREATED).body(bookingService.createBooking(request, currentUser));
    }

    @GetMapping("/my")
    public ResponseEntity<List<BookingResponseDTO>> getMyBookings() {
        return ResponseEntity.ok(bookingService.getMyBookings(bookingSecurityContext.getCurrentUser()));
    }

    @GetMapping
    public ResponseEntity<List<BookingResponseDTO>> getAllBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) Long userId) {
        User currentUser = bookingSecurityContext.getCurrentUser();
        bookingSecurityContext.requireAdmin(currentUser);
        return ResponseEntity.ok(bookingService.getAllBookings(status, startDate, endDate, resourceId, userId));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<BookingResponseDTO> approveBooking(@PathVariable Long id) {
        User currentUser = bookingSecurityContext.getCurrentUser();
        bookingSecurityContext.requireAdmin(currentUser);
        return ResponseEntity.ok(bookingService.approveBooking(id, currentUser));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<BookingResponseDTO> rejectBooking(@PathVariable Long id,
                                                            @Valid @RequestBody BookingRejectRequestDTO request) {
        User currentUser = bookingSecurityContext.getCurrentUser();
        bookingSecurityContext.requireAdmin(currentUser);
        return ResponseEntity.ok(bookingService.rejectBooking(id, request, currentUser));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<BookingResponseDTO> cancelBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.cancelBooking(id, bookingSecurityContext.getCurrentUser()));
    }

    @GetMapping("/conflicts/check")
    public ResponseEntity<BookingConflictCheckResponseDTO> checkConflicts(
            @RequestParam Long resourceId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime,
            @RequestParam(required = false) Integer expectedAttendees) {
        return ResponseEntity.ok(bookingService.checkConflicts(resourceId, date, startTime, endTime, expectedAttendees));
    }

    @GetMapping("/unavailable")
    public ResponseEntity<List<Long>> getUnavailableResourceIds(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime startTime,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) LocalTime endTime) {
        return ResponseEntity.ok(bookingService.getUnavailableResourceIds(date, startTime, endTime));
    }

    @GetMapping("/{id}/qr")
    public ResponseEntity<BookingQrCodeDTO> getBookingQrCode(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getQrCode(id, bookingSecurityContext.getCurrentUser()));
    }

    @PostMapping("/check-in")
    public ResponseEntity<BookingResponseDTO> checkIn(@Valid @RequestBody BookingCheckInRequestDTO request) {
        return ResponseEntity.ok(bookingService.checkIn(request, bookingSecurityContext.getCurrentUser()));
    }

    @GetMapping("/analytics/peak-hours")
    public ResponseEntity<BookingAnalyticsDTO> getPeakHourAnalytics() {
        User currentUser = bookingSecurityContext.getCurrentUser();
        bookingSecurityContext.requireAdmin(currentUser);
        return ResponseEntity.ok(bookingService.getPeakHourAnalytics());
    }
}
