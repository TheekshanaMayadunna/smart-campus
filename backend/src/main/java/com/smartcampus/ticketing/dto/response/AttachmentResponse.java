package com.smartcampus.ticketing.dto.response;

import com.smartcampus.ticketing.entity.TicketAttachmentEntity;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AttachmentResponse {
    private Long attachmentId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private LocalDateTime uploadedAt;

    public static AttachmentResponse fromEntity(TicketAttachmentEntity entity) {
        AttachmentResponse response = new AttachmentResponse();
        response.setAttachmentId(entity.getAttachmentId());
        response.setFileName(entity.getFileName());
        response.setFilePath(entity.getFilePath());
        response.setFileSize(entity.getFileSize());
        response.setContentType(entity.getContentType());
        response.setUploadedAt(entity.getUploadedAt());
        return response;
    }
}