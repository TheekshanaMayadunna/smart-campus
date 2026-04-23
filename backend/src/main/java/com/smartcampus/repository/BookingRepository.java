package com.smartcampus.repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.smartcampus.model.Booking;
import com.smartcampus.model.Booking.BookingStatus;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findByUserId(Long userId);

    @Query("SELECT DISTINCT b.resource.id FROM Booking b " +
            "WHERE b.date = :date " +
            "AND b.status IN :statuses " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime")
    List<Long> findUnavailableResourceIds(@Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<BookingStatus> statuses);

    @Query("SELECT b FROM Booking b " +
            "WHERE (:status IS NULL OR b.status = :status) " +
            "AND (:date IS NULL OR b.date = :date) " +
            "AND (:resourceId IS NULL OR b.resource.id = :resourceId) " +
            "AND (:userId IS NULL OR b.user.id = :userId) " +
            "ORDER BY b.createdAt DESC")
    List<Booking> findAllWithFilters(@Param("status") BookingStatus status,
            @Param("date") LocalDate date,
            @Param("resourceId") Long resourceId,
            @Param("userId") Long userId);

    @Query("SELECT b FROM Booking b " +
            "WHERE b.resource.id = :resourceId " +
            "AND b.date = :date " +
            "AND b.status IN :statuses " +
            "AND b.startTime < :endTime " +
            "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(@Param("resourceId") Long resourceId,
            @Param("date") LocalDate date,
            @Param("startTime") LocalTime startTime,
            @Param("endTime") LocalTime endTime,
            @Param("statuses") List<BookingStatus> statuses);

    default List<Booking> findConflictingBookings(Long resourceId, LocalDate date, LocalTime startTime,
            LocalTime endTime) {
        return findConflictingBookings(resourceId, date, startTime, endTime,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED));
    }

    default List<Long> findUnavailableResourceIds(LocalDate date, LocalTime startTime, LocalTime endTime) {
        return findUnavailableResourceIds(date, startTime, endTime,
                Arrays.asList(BookingStatus.PENDING, BookingStatus.APPROVED));
    }

    @Modifying
    @Query("DELETE FROM Booking b WHERE b.user.id = :userId")
    int deleteAllByUserId(@Param("userId") Long userId);

    List<Booking> findAllByOrderByCreatedAtDesc();
}
