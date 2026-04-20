package com.smartcampus.ticketing.repository;

import com.smartcampus.ticketing.entity.TicketAttachmentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TicketAttachmentRepository extends JpaRepository<TicketAttachmentEntity, Long> {
    List<TicketAttachmentEntity> findByTicket_TicketId(Long ticketId);
}