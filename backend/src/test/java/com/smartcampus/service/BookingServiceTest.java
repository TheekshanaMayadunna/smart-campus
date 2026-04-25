package com.smartcampus.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Booking.BookingStatus;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBookingBlocksConflictingTimeRanges() {
        BookingRequest request = validRequest();
        User user = buildUser(10L, "USER");
        Resource resource = buildResource(5L);

        when(resourceRepository.findById(5L)).thenReturn(Optional.of(resource));
        when(bookingRepository.findConflictingBookings(5L, request.getDate(), request.getStartTime(), request.getEndTime()))
                .thenReturn(Collections.singletonList(new Booking()));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(request, user));

        assertEquals("Time slot already booked", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createBookingRejectsAttendeesOverCapacity() {
        BookingRequest request = validRequest();
        request.setAttendees(50);
        User user = buildUser(10L, "USER");
        Resource resource = buildResource(5L);

        when(resourceRepository.findById(5L)).thenReturn(Optional.of(resource));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.createBooking(request, user));

        assertEquals("Attendees exceed selected resource capacity of 30", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void approveBookingAllowsOnlyPendingState() {
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.REJECTED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.approveBooking(1L));

        assertEquals("Only PENDING bookings can be approved", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void rejectBookingAllowsOnlyPendingState() {
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findById(2L)).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.rejectBooking(2L, "Not suitable"));

        assertEquals("Only PENDING bookings can be rejected", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void cancelBookingAllowsOnlyApprovedState() {
        User owner = buildUser(22L, "USER");
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.PENDING);
        booking.setUser(owner);

        when(bookingRepository.findById(3L)).thenReturn(Optional.of(booking));

        RuntimeException ex = assertThrows(RuntimeException.class, () -> bookingService.cancelBooking(3L, owner));

        assertEquals("Only APPROVED bookings can be cancelled", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void cancelBookingAllowsApprovedStateForOwner() {
        User owner = buildUser(33L, "USER");
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.APPROVED);
        booking.setUser(owner);

        when(bookingRepository.findById(4L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        Booking saved = bookingService.cancelBooking(4L, owner);

        assertEquals(BookingStatus.CANCELLED, saved.getStatus());
        verify(bookingRepository).save(booking);
    }

    @Test
    void getUnavailableResourceIdsRequiresValidTimeRange() {
        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> bookingService.getUnavailableResourceIds(LocalDate.now().plusDays(1), LocalTime.of(11, 0),
                        LocalTime.of(10, 0)));

        assertEquals("End time must be after start time", ex.getMessage());
    }

    @Test
    void getUnavailableResourceIdsReturnsRepositoryResult() {
        LocalDate date = LocalDate.now().plusDays(2);
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(10, 0);
        when(bookingRepository.findUnavailableResourceIds(date, startTime, endTime))
                .thenReturn(Arrays.asList(1L, 4L));

        assertEquals(Arrays.asList(1L, 4L), bookingService.getUnavailableResourceIds(date, startTime, endTime));
    }

    private BookingRequest validRequest() {
        BookingRequest request = new BookingRequest();
        request.setResourceId(5L);
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setPurpose("Lab session");
        request.setAttendees(12);
        return request;
    }

    private User buildUser(Long id, String role) {
        User user = new User();
        user.setRole(role);
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Resource buildResource(Long id) {
        Resource resource = new Resource();
        ReflectionTestUtils.setField(resource, "id", id);
        resource.setCapacity(30);
        return resource;
    }
}
