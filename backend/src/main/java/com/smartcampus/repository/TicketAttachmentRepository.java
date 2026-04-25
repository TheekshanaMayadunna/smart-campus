package com.smartcampus.repository;

import com.smartcampus.model.TicketAttachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketAttachmentRepository extends JpaRepository<TicketAttachment, Long> {

    @Modifying
    @Query("DELETE FROM TicketAttachment a WHERE a.ticket.createdBy.id = :userId")
    int deleteAllByTicketCreatedByUserId(@Param("userId") Long userId);
}
