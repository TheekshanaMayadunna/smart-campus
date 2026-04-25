package com.smartcampus.service;

import com.smartcampus.dto.booking.BookingCreateRequestDTO;
import com.smartcampus.dto.booking.BookingRejectRequestDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.booking.Booking;
import com.smartcampus.model.booking.BookingStatus;
import com.smartcampus.model.resources.Resource;
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.booking.BookingRepository;
import com.smartcampus.repository.resources.ResourceRepository;
import com.smartcampus.service.booking.BookingQrCodeService;
import com.smartcampus.service.booking.BookingService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@SuppressWarnings("null")
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private ResourceRepository resourceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private BookingQrCodeService bookingQrCodeService;

    @InjectMocks
    private BookingService bookingService;

    @Test
    void createBookingBlocksConflictingTimeRanges() {
        BookingCreateRequestDTO request = validRequest();
        User user = buildUser(10L, "USER");
        Resource resource = buildResource(5L);

        when(resourceRepository.findById(5L)).thenReturn(Optional.of(resource));
        when(bookingRepository.findConflicts(eq(5L), eq(request.getDate()), eq(request.getStartTime()), eq(request.getEndTime()), any(), eq(null)))
                .thenReturn(Collections.singletonList(new Booking()));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> bookingService.createBooking(request, user));

        assertEquals("Time slot already booked", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void createBookingRejectsAttendeesOverCapacity() {
        BookingCreateRequestDTO request = validRequest();
        request.setExpectedAttendees(50);
        User user = buildUser(10L, "USER");
        Resource resource = buildResource(5L);

        when(resourceRepository.findById(5L)).thenReturn(Optional.of(resource));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> bookingService.createBooking(request, user));

        assertEquals("Expected attendees exceed selected resource capacity of 30", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void approveBookingAllowsOnlyPendingState() {
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.REJECTED);
        when(bookingRepository.findById(1L)).thenReturn(Optional.of(booking));

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> bookingService.approveBooking(1L, buildUser(1L, "ADMIN")));

        assertEquals("Only PENDING bookings can be approved", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void rejectBookingAllowsOnlyPendingState() {
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.APPROVED);
        when(bookingRepository.findById(2L)).thenReturn(Optional.of(booking));

        BookingRejectRequestDTO request = new BookingRejectRequestDTO();
        request.setReason("Not suitable");

        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> bookingService.rejectBooking(2L, request, buildUser(1L, "ADMIN")));

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

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> bookingService.cancelBooking(3L, owner));

        assertEquals("Only APPROVED bookings can be cancelled", ex.getMessage());
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    void cancelBookingAllowsApprovedStateForOwner() {
        User owner = buildUser(33L, "USER");
        Booking booking = new Booking();
        booking.setStatus(BookingStatus.APPROVED);
        booking.setUser(owner);
        booking.setResource(buildResource(4L));

        when(bookingRepository.findById(4L)).thenReturn(Optional.of(booking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(inv -> inv.getArgument(0));

        var saved = bookingService.cancelBooking(4L, owner);

        assertEquals(BookingStatus.CANCELLED, saved.getStatus());
        verify(bookingRepository).save(booking);
    }

    @Test
    void getUnavailableResourceIdsRequiresValidTimeRange() {
        IllegalStateException ex = assertThrows(IllegalStateException.class,
                () -> bookingService.getUnavailableResourceIds(LocalDate.now().plusDays(1), LocalTime.of(11, 0),
                        LocalTime.of(10, 0)));

        assertEquals("End time must be after start time", ex.getMessage());
    }

    @Test
    void getUnavailableResourceIdsReturnsRepositoryResult() {
        LocalDate date = LocalDate.now().plusDays(2);
        LocalTime startTime = LocalTime.of(9, 0);
        LocalTime endTime = LocalTime.of(10, 0);
        when(bookingRepository.findUnavailableResourceIds(eq(date), eq(startTime), eq(endTime), any()))
                .thenReturn(Arrays.asList(1L, 4L));

        assertEquals(Arrays.asList(1L, 4L), bookingService.getUnavailableResourceIds(date, startTime, endTime));
    }

    private BookingCreateRequestDTO validRequest() {
        BookingCreateRequestDTO request = new BookingCreateRequestDTO();
        request.setResourceId(5L);
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(11, 0));
        request.setPurpose("Lab session");
        request.setExpectedAttendees(12);
        return request;
    }

    private User buildUser(Long id, String role) {
        User user = new User();
        user.setRole(role);
        user.setName("Test User");
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Resource buildResource(Long id) {
        Resource resource = new Resource();
        ReflectionTestUtils.setField(resource, "id", id);
        resource.setCapacity(30);
        resource.setStatus(ResourceStatus.ACTIVE);
        resource.setAvailabilityStart(LocalTime.of(8, 0));
        resource.setAvailabilityEnd(LocalTime.of(18, 0));
        resource.setDeleted(false);
        return resource;
    }
}
