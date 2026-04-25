package com.smartcampus.repository;

import com.smartcampus.model.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TicketRepository extends JpaRepository<Ticket, Long> {
    List<Ticket> findByAssignedTechnicianId(Long techId);

    List<Ticket> findByCreatedById(Long userId);

    @Query("select t from Ticket t where t.createdBy.id = :reporterId")
    List<Ticket> findByReporterId(@Param("reporterId") Long reporterId);

    @Query("SELECT DISTINCT t FROM Ticket t LEFT JOIN FETCH t.createdBy LEFT JOIN FETCH t.assignedTechnician WHERE t.id = :id")
    Optional<Ticket> findDetailById(@Param("id") Long id);

    @Modifying
    @Query("UPDATE Ticket t SET t.assignedTechnician = null WHERE t.assignedTechnician.id = :userId")
    int clearAssignedTechnician(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.createdBy.id = :userId")
    int deleteAllCreatedBy(@Param("userId") Long userId);
}
