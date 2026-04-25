package com.smartcampus.repository.booking;

import com.smartcampus.model.booking.Booking;
import com.smartcampus.model.booking.BookingStatus;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    @Query("""
            select b from Booking b
            where (:status is null or b.status = :status)
              and (:startDate is null or b.date >= :startDate)
              and (:endDate is null or b.date <= :endDate)
              and (:resourceId is null or b.resource.id = :resourceId)
              and (:userId is null or b.user.id = :userId)
            order by b.date desc, b.startTime desc, b.createdAt desc
            """)
    List<Booking> findAllWithFilters(
            @Param("status") BookingStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("resourceId") Long resourceId,
            @Param("userId") Long userId);

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    @Query("""
            select b from Booking b
            where b.resource.id = :resourceId
              and b.date = :date
              and b.status in :statuses
            order by b.startTime asc
            """)
    List<Booking> findByResourceAndDateAndStatuses(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("statuses") Collection<BookingStatus> statuses);

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    @Query("""
            select b from Booking b
            where b.resource.id = :resourceId
              and b.date = :date
              and b.status in :statuses
              and b.startTime < :endTime
              and b.endTime > :startTime
              and (:excludeBookingId is null or b.id <> :excludeBookingId)
            order by b.startTime asc
            """)
    List<Booking> findConflicts(
            @Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses,
            @Param("excludeBookingId") Long excludeBookingId);

    @Query("""
            select distinct b.resource.id from Booking b
            where b.date = :date
              and b.status in :statuses
              and b.startTime < :endTime
              and b.endTime > :startTime
            """)
    List<Long> findUnavailableResourceIds(
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") Collection<BookingStatus> statuses);

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    Optional<Booking> findByCheckInToken(String checkInToken);

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    @Override
    Optional<Booking> findById(Long id);

    @EntityGraph(attributePaths = {"resource", "user", "approvedBy"})
    List<Booking> findAllByOrderByCreatedAtDesc();

    @Modifying
    @Query("""
            update Booking b
               set b.status = :expiredStatus,
                   b.updatedAt = :now
             where b.status = :pendingStatus
               and (b.date < :today or (b.date = :today and b.endTime < :currentTime))
            """)
    int expirePendingBookings(
            @Param("pendingStatus") BookingStatus pendingStatus,
            @Param("expiredStatus") BookingStatus expiredStatus,
            @Param("today") LocalDate today,
            @Param("currentTime") LocalTime currentTime,
            @Param("now") LocalDateTime now);

    @Modifying
    @Query("delete from Booking b where b.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);
}
