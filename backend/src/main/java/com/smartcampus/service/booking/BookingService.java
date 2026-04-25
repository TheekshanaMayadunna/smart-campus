package com.smartcampus.service.booking;

import com.smartcampus.dto.booking.BookingAnalyticsDTO;
import com.smartcampus.dto.booking.BookingAvailableSlotDTO;
import com.smartcampus.dto.booking.BookingCheckInRequestDTO;
import com.smartcampus.dto.booking.BookingConflictCheckResponseDTO;
import com.smartcampus.dto.booking.BookingCreateRequestDTO;
import com.smartcampus.dto.booking.BookingPeakHourDTO;
import com.smartcampus.dto.booking.BookingQrCodeDTO;
import com.smartcampus.dto.booking.BookingRejectRequestDTO;
import com.smartcampus.dto.booking.BookingResponseDTO;
import com.smartcampus.model.Auth.User;
import com.smartcampus.model.NotificationType;
import com.smartcampus.model.booking.Booking;
import com.smartcampus.model.booking.BookingStatus;
import com.smartcampus.model.resources.Resource;
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.repository.Auth.UserRepository;
import com.smartcampus.repository.booking.BookingRepository;
import com.smartcampus.repository.resources.ResourceRepository;
import com.smartcampus.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BookingService {
    private static final Set<BookingStatus> ACTIVE_CONFLICT_STATUSES = EnumSet.of(BookingStatus.PENDING, BookingStatus.APPROVED);
    private static final Set<BookingStatus> APPROVAL_CONFLICT_STATUSES = EnumSet.of(BookingStatus.APPROVED);
    private static final DateTimeFormatter SLOT_FORMAT = DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH);

    private final BookingRepository bookingRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final BookingQrCodeService bookingQrCodeService;

    @Transactional
    public BookingResponseDTO createBooking(BookingCreateRequestDTO request, User currentUser) {
        expirePastPendingBookings();
        Resource resource = getBookableResource(request.getResourceId());
        validateRequest(request, resource);
        ensureNoConflicts(resource.getId(), request.getDate(), request.getStartTime(), request.getEndTime(), null,
                ACTIVE_CONFLICT_STATUSES);

        Booking booking = Booking.builder()
                .resource(resource)
                .user(currentUser)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose().trim())
                .expectedAttendees(request.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        Booking saved = bookingRepository.save(booking);
        notifyAdmins(
                NotificationType.BOOKING_REQUESTED,
                "New booking request",
                "Booking request #" + saved.getId() + " was created by " + safeName(currentUser) + ".");
        return toResponse(saved);
    }

    @Transactional
    public List<BookingResponseDTO> getMyBookings(User currentUser) {
        expirePastPendingBookings();
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<BookingResponseDTO> getAllBookings(BookingStatus status, LocalDate startDate, LocalDate endDate,
                                                   Long resourceId, Long userId) {
        expirePastPendingBookings();
        return bookingRepository.findAllWithFilters(status, startDate, endDate, resourceId, userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public BookingResponseDTO approveBooking(Long id, User admin) {
        expirePastPendingBookings();
        Booking booking = getBooking(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be approved");
        }

        ensureNoConflicts(booking.getResource().getId(), booking.getDate(), booking.getStartTime(), booking.getEndTime(),
                booking.getId(), APPROVAL_CONFLICT_STATUSES);

        booking.setStatus(BookingStatus.APPROVED);
        booking.setApprovedBy(admin);
        booking.setApprovedAt(LocalDateTime.now());
        booking.setRejectionReason(null);
        booking.setCheckInToken(UUID.randomUUID().toString());
        booking.setCheckInTokenExpiresAt(LocalDateTime.of(booking.getDate(), booking.getEndTime()));
        Booking saved = bookingRepository.save(booking);

        notificationService.create(
                saved.getUser(),
                NotificationType.BOOKING_APPROVED,
                "Booking approved",
                "Your booking request #" + saved.getId() + " has been approved.",
                "BOOKING",
                saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public BookingResponseDTO rejectBooking(Long id, BookingRejectRequestDTO request, User admin) {
        expirePastPendingBookings();
        Booking booking = getBooking(id);
        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new IllegalStateException("Only PENDING bookings can be rejected");
        }

        booking.setStatus(BookingStatus.REJECTED);
        booking.setApprovedBy(admin);
        booking.setApprovedAt(LocalDateTime.now());
        booking.setRejectionReason(request.getReason().trim());
        booking.setCheckInToken(null);
        booking.setCheckInTokenExpiresAt(null);
        Booking saved = bookingRepository.save(booking);

        notificationService.create(
                saved.getUser(),
                NotificationType.BOOKING_REJECTED,
                "Booking rejected",
                "Your booking request #" + saved.getId() + " was rejected. Reason: " + saved.getRejectionReason(),
                "BOOKING",
                saved.getId());
        return toResponse(saved);
    }

    @Transactional
    public BookingResponseDTO cancelBooking(Long id, User actor) {
        expirePastPendingBookings();
        Booking booking = getBooking(id);
        boolean isOwner = Objects.equals(booking.getUser().getId(), actor.getId());
        boolean isAdmin = isAdmin(actor);
        if (!isOwner && !isAdmin) {
            throw new IllegalStateException("You do not have permission to cancel this booking");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED bookings can be cancelled");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCheckInToken(null);
        booking.setCheckInTokenExpiresAt(null);
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    @Transactional
    public BookingConflictCheckResponseDTO checkConflicts(Long resourceId, LocalDate date, LocalTime startTime,
                                                          LocalTime endTime, Integer expectedAttendees) {
        expirePastPendingBookings();
        Resource resource = getBookableResource(resourceId);
        validateTimeRange(date, startTime, endTime);
        validateAvailability(resource, startTime, endTime);
        validateAttendeeCount(resource, expectedAttendees);

        List<Booking> conflicts = bookingRepository.findConflicts(resourceId, date, startTime, endTime,
                ACTIVE_CONFLICT_STATUSES, null);

        int remainingCapacity = resource.getCapacity() == null ? 0 : resource.getCapacity() - (expectedAttendees == null ? 0 : expectedAttendees);
        if (!conflicts.isEmpty()) {
            return BookingConflictCheckResponseDTO.builder()
                    .conflict(true)
                    .message("Requested slot overlaps an existing booking")
                    .remainingCapacity(Math.max(remainingCapacity, 0))
                    .availableSlots(suggestAvailableSlots(resource, date, durationBetween(startTime, endTime)))
                    .build();
        }

        return BookingConflictCheckResponseDTO.builder()
                .conflict(false)
                .message("Requested slot is available")
                .remainingCapacity(Math.max(remainingCapacity, 0))
                .availableSlots(suggestAvailableSlots(resource, date, durationBetween(startTime, endTime)))
                .build();
    }

    @Transactional
    public List<Long> getUnavailableResourceIds(LocalDate date, LocalTime startTime, LocalTime endTime) {
        expirePastPendingBookings();
        validateTimeRange(date, startTime, endTime);
        return bookingRepository.findUnavailableResourceIds(date, startTime, endTime, ACTIVE_CONFLICT_STATUSES);
    }

    @Transactional
    public BookingQrCodeDTO getQrCode(Long bookingId, User actor) {
        expirePastPendingBookings();
        Booking booking = getBooking(bookingId);
        if (!Objects.equals(booking.getUser().getId(), actor.getId()) && !isAdmin(actor)) {
            throw new IllegalStateException("You do not have permission to view this QR code");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED bookings can generate a check-in QR code");
        }
        if (booking.getCheckInToken() == null || booking.getCheckInTokenExpiresAt() == null
                || booking.getCheckInTokenExpiresAt().isBefore(LocalDateTime.now())) {
            booking.setCheckInToken(UUID.randomUUID().toString());
            booking.setCheckInTokenExpiresAt(LocalDateTime.of(booking.getDate(), booking.getEndTime()));
            booking = bookingRepository.save(booking);
        }

        String payload = "SMARTCAMPUS:BOOKING:" + booking.getId() + ":" + booking.getCheckInToken();
        return BookingQrCodeDTO.builder()
                .bookingId(booking.getId())
                .token(booking.getCheckInToken())
                .tokenExpiresAt(booking.getCheckInTokenExpiresAt())
                .qrCodeDataUrl(bookingQrCodeService.toDataUrl(payload))
                .build();
    }

    @Transactional
    public BookingResponseDTO checkIn(BookingCheckInRequestDTO request, User actor) {
        expirePastPendingBookings();
        Booking booking = bookingRepository.findByCheckInToken(request.getToken().trim())
                .orElseThrow(() -> new IllegalStateException("Booking check-in token is invalid"));

        boolean isOwner = Objects.equals(booking.getUser().getId(), actor.getId());
        if (!isOwner && !isAdmin(actor)) {
            throw new IllegalStateException("You do not have permission to check in for this booking");
        }
        if (booking.getStatus() != BookingStatus.APPROVED) {
            throw new IllegalStateException("Only APPROVED bookings can be checked in");
        }
        if (booking.getCheckedInAt() != null) {
            throw new IllegalStateException("Booking has already been checked in");
        }
        if (booking.getCheckInTokenExpiresAt() == null || booking.getCheckInTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new IllegalStateException("Booking check-in token has expired");
        }

        booking.setCheckedInAt(LocalDateTime.now());
        Booking saved = bookingRepository.save(booking);
        return toResponse(saved);
    }

    @Transactional
    public BookingAnalyticsDTO getPeakHourAnalytics() {
        expirePastPendingBookings();
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc();
        List<Booking> activeBookings = bookings.stream()
                .filter(booking -> booking.getStatus() != BookingStatus.REJECTED && booking.getStatus() != BookingStatus.CANCELLED)
                .toList();

        List<BookingPeakHourDTO> peakHours = activeBookings.stream()
                .collect(java.util.stream.Collectors.groupingBy(booking -> booking.getStartTime().getHour(), java.util.stream.Collectors.counting()))
                .entrySet()
                .stream()
                .sorted(java.util.Map.Entry.<Integer, Long>comparingByValue().reversed())
                .map(entry -> new BookingPeakHourDTO(entry.getKey(), entry.getValue(), formatHour(entry.getKey())))
                .toList();

        long checkedIn = bookings.stream().filter(booking -> booking.getCheckedInAt() != null).count();
        return BookingAnalyticsDTO.builder()
                .totalBookings(bookings.size())
                .pendingBookings(bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.PENDING).count())
                .approvedBookings(bookings.stream().filter(booking -> booking.getStatus() == BookingStatus.APPROVED).count())
                .checkedInBookings(checkedIn)
                .peakBookingHours(peakHours)
                .build();
    }

    @Scheduled(cron = "0 */15 * * * *")
    @Transactional
    public void expirePastPendingBookings() {
        bookingRepository.expirePendingBookings(
                BookingStatus.PENDING,
                BookingStatus.EXPIRED,
                LocalDate.now(),
                LocalTime.now(),
                LocalDateTime.now());
    }

    private Booking getBooking(Long bookingId) {
        Long resolvedId = Objects.requireNonNull(bookingId, "Booking ID is required");
        return bookingRepository.findById(resolvedId)
                .orElseThrow(() -> new IllegalStateException("Booking not found with ID: " + bookingId));
    }

    private Resource getBookableResource(Long resourceId) {
        Long resolvedId = Objects.requireNonNull(resourceId, "Resource ID is required");
        Resource resource = resourceRepository.findById(resolvedId)
                .orElseThrow(() -> new IllegalStateException("Resource not found with ID: " + resourceId));
        if (resource.isDeleted()) {
            throw new IllegalStateException("Selected resource is inactive");
        }
        if (resource.getStatus() == ResourceStatus.OUT_OF_SERVICE) {
            throw new IllegalStateException("Selected resource is out of service");
        }
        if (resource.getStatus() == ResourceStatus.INACTIVE) {
            throw new IllegalStateException("Selected resource is inactive");
        }
        return resource;
    }

    private void validateRequest(BookingCreateRequestDTO request, Resource resource) {
        validateTimeRange(request.getDate(), request.getStartTime(), request.getEndTime());
        validateAttendeeCount(resource, request.getExpectedAttendees());
        validateAvailability(resource, request.getStartTime(), request.getEndTime());
    }

    private void validateTimeRange(LocalDate date, LocalTime startTime, LocalTime endTime) {
        if (date == null || startTime == null || endTime == null) {
            throw new IllegalStateException("Date, start time, and end time are required");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalStateException("End time must be after start time");
        }
    }

    private void validateAttendeeCount(Resource resource, Integer expectedAttendees) {
        if (expectedAttendees == null || expectedAttendees < 1) {
            throw new IllegalStateException("Expected attendees must be at least 1");
        }
        if (resource.getCapacity() != null && expectedAttendees > resource.getCapacity()) {
            throw new IllegalStateException("Expected attendees exceed selected resource capacity of " + resource.getCapacity());
        }
    }

    private void validateAvailability(Resource resource, LocalTime startTime, LocalTime endTime) {
        if (resource.getAvailabilityStart() != null && startTime.isBefore(resource.getAvailabilityStart())) {
            throw new IllegalStateException("Booking start time is outside the resource availability window");
        }
        if (resource.getAvailabilityEnd() != null && endTime.isAfter(resource.getAvailabilityEnd())) {
            throw new IllegalStateException("Booking end time is outside the resource availability window");
        }
    }

    private void ensureNoConflicts(Long resourceId, LocalDate date, LocalTime startTime, LocalTime endTime,
                                   Long excludeBookingId, Set<BookingStatus> statuses) {
        List<Booking> conflicts = bookingRepository.findConflicts(resourceId, date, startTime, endTime, statuses, excludeBookingId);
        if (!conflicts.isEmpty()) {
            throw new IllegalStateException("Time slot already booked");
        }
    }

    private List<BookingAvailableSlotDTO> suggestAvailableSlots(Resource resource, LocalDate date, Duration requestedDuration) {
        if (resource.getAvailabilityStart() == null || resource.getAvailabilityEnd() == null) {
            return List.of();
        }

        Duration minimumDuration = requestedDuration == null || requestedDuration.isNegative() || requestedDuration.isZero()
                ? Duration.ofHours(1)
                : requestedDuration;

        List<Booking> occupied = bookingRepository.findByResourceAndDateAndStatuses(resource.getId(), date, ACTIVE_CONFLICT_STATUSES)
                .stream()
                .sorted(Comparator.comparing(Booking::getStartTime))
                .toList();

        List<BookingAvailableSlotDTO> slots = new ArrayList<>();
        LocalTime cursor = resource.getAvailabilityStart();
        for (Booking booking : occupied) {
            if (cursor.isBefore(booking.getStartTime())) {
                addSlotIfFits(slots, cursor, booking.getStartTime(), minimumDuration);
            }
            if (booking.getEndTime().isAfter(cursor)) {
                cursor = booking.getEndTime();
            }
        }
        if (cursor.isBefore(resource.getAvailabilityEnd())) {
            addSlotIfFits(slots, cursor, resource.getAvailabilityEnd(), minimumDuration);
        }
        return slots.stream().limit(5).toList();
    }

    private void addSlotIfFits(List<BookingAvailableSlotDTO> slots, LocalTime start, LocalTime end, Duration minimumDuration) {
        if (Duration.between(start, end).compareTo(minimumDuration) < 0) {
            return;
        }
        slots.add(BookingAvailableSlotDTO.builder()
                .startTime(start)
                .endTime(end)
                .label(start.format(SLOT_FORMAT) + " - " + end.format(SLOT_FORMAT))
                .build());
    }

    private Duration durationBetween(LocalTime startTime, LocalTime endTime) {
        if (startTime == null || endTime == null) {
            return Duration.ZERO;
        }
        return Duration.between(startTime, endTime);
    }

    private BookingResponseDTO toResponse(Booking booking) {
        boolean canCheckIn = booking.getStatus() == BookingStatus.APPROVED
                && booking.getCheckedInAt() == null
                && booking.getCheckInTokenExpiresAt() != null
                && booking.getCheckInTokenExpiresAt().isAfter(LocalDateTime.now());

        return BookingResponseDTO.builder()
                .id(booking.getId())
                .resourceId(booking.getResource() == null ? null : booking.getResource().getId())
                .resourceName(booking.getResource() == null ? null : booking.getResource().getName())
                .resourceLocation(booking.getResource() == null ? null : booking.getResource().getLocation())
                .userId(booking.getUser() == null ? null : booking.getUser().getId())
                .userName(booking.getUser() == null ? null : booking.getUser().getName())
                .userEmail(booking.getUser() == null ? null : booking.getUser().getEmail())
                .date(booking.getDate())
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .approvedById(booking.getApprovedBy() == null ? null : booking.getApprovedBy().getId())
                .approvedByName(booking.getApprovedBy() == null ? null : booking.getApprovedBy().getName())
                .approvedAt(booking.getApprovedAt())
                .checkedInAt(booking.getCheckedInAt())
                .canCheckIn(canCheckIn)
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .build();
    }

    private void notifyAdmins(NotificationType type, String title, String message) {
        userRepository.findAll().stream()
                .filter(this::isAdmin)
                .forEach(admin -> notificationService.create(admin, type, title, message, "BOOKING", null));
    }

    private boolean isAdmin(User user) {
        return user != null && user.getRole() != null && "ADMIN".equalsIgnoreCase(user.getRole());
    }

    private String safeName(User user) {
        if (user == null || user.getName() == null || user.getName().isBlank()) {
            return "User";
        }
        return user.getName().trim();
    }

    private String formatHour(int hour) {
        LocalTime time = LocalTime.of(hour, 0);
        return time.format(SLOT_FORMAT);
    }
}
