package com.smartcampus.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;

import com.smartcampus.dto.BookingRequest;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.Booking;
import com.smartcampus.model.Booking.BookingStatus;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.Resource;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.BookingRepository;
import com.smartcampus.repository.ResourceRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public BookingService(BookingRepository bookingRepository,
            ResourceRepository resourceRepository,
            UserRepository userRepository,
            NotificationService notificationService) {
        this.bookingRepository = bookingRepository;
        this.resourceRepository = resourceRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public Booking createBooking(BookingRequest request, User user) {
        Long resourceId = Objects.requireNonNull(request.getResourceId(), "Resource ID is required");
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found with ID: " + resourceId));

        if (!request.getEndTime().isAfter(request.getStartTime())) {
            throw new RuntimeException("End time must be after start time");
        }
        Integer resourceCapacity = resource.getCapacity();
        if (resourceCapacity != null && request.getAttendees() > resourceCapacity) {
            throw new RuntimeException("Attendees exceed selected resource capacity of " + resourceCapacity);
        }

        List<Booking> conflictingBookings = bookingRepository.findConflictingBookings(
                resource.getId(),
                request.getDate(),
                request.getStartTime(),
                request.getEndTime()
        );

        if (!conflictingBookings.isEmpty()) {
            throw new RuntimeException("Time slot already booked");
        }

        Booking booking = new Booking();
        booking.setUser(user);
        booking.setResource(resource);
        booking.setDate(request.getDate());
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setAttendees(request.getAttendees());
        booking.setStatus(BookingStatus.PENDING);

        Booking saved = bookingRepository.save(booking);
        userRepository.findAll().stream()
                .filter(candidate -> "ADMIN".equalsIgnoreCase(candidate.getRole()))
                .forEach(admin -> notificationService.create(
                        admin,
                        NotificationType.BOOKING_REQUESTED,
                        "New booking request",
                        "Booking request #" + saved.getId() + " was created by " + user.getName() + ".",
                        "BOOKING",
                        saved.getId()));
        return saved;
    }

    public List<Booking> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId);
    }

    public List<Booking> getAllBookings() {
        return bookingRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Booking> getAllBookings(BookingStatus status, LocalDate date, Long resourceId, Long userId) {
        return bookingRepository.findAllWithFilters(status, date, resourceId, userId);
    }

    public List<Long> getUnavailableResourceIds(LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date == null || startTime == null || endTime == null) {
            throw new RuntimeException("Date, start time, and end time are required");
        }
        if (!endTime.isAfter(startTime)) {
            throw new RuntimeException("End time must be after start time");
        }
        return bookingRepository.findUnavailableResourceIds(date, startTime, endTime);
    }

    public Booking approveBooking(Long id) {
        Long bookingId = Objects.requireNonNull(id, "Booking ID is required");
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be approved");
        }
        booking.setStatus(BookingStatus.APPROVED);
        booking.setRejectionReason(null);
        Booking saved = bookingRepository.save(booking);
        notificationService.create(
                saved.getUser(),
                com.smartcampus.model.NotificationType.BOOKING_APPROVED,
                "Booking approved",
                "Your booking request #" + saved.getId() + " has been approved.",
                "BOOKING",
                saved.getId());
        return saved;
    }

    public Booking rejectBooking(Long id, String reason) {
        Long bookingId = Objects.requireNonNull(id, "Booking ID is required");
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new RuntimeException("Only PENDING bookings can be rejected");
        }
        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(reason);
        Booking saved = bookingRepository.save(booking);
        notificationService.create(
                saved.getUser(),
                com.smartcampus.model.NotificationType.BOOKING_REJECTED,
                "Booking rejected",
                "Your booking request #" + saved.getId() + " was rejected. Reason: "
                        + (reason == null || reason.isBlank() ? "Not provided" : reason),
                "BOOKING",
                saved.getId());
        return saved;
    }

    public Booking cancelBooking(Long id, User currentUser) {
        Long bookingId = Objects.requireNonNull(id, "Booking ID is required");
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found with ID: " + id));

        boolean isOwner = booking.getUser().getId().equals(currentUser.getId());
        boolean isAdmin = "ADMIN".equalsIgnoreCase(currentUser.getRole());

        if (isOwner || isAdmin) {
            if (booking.getStatus() != BookingStatus.APPROVED) {
                throw new RuntimeException("Only APPROVED bookings can be cancelled");
            }
            booking.setStatus(BookingStatus.CANCELLED);
            return bookingRepository.save(booking);
        } else {
            throw new RuntimeException("You do not have permission to cancel this booking");
        }
    }
}

            
            