package com.smartcampus.dto.resources;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ResourceImageResponseDto {
    private Long id;
    private String originalFileName;
    private String storedFileName;
    private String fileType;
    private Long fileSize;
    private String imageUrl;
    private LocalDateTime uploadedAt;
}