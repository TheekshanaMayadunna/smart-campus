package com.smartcampus.dto.resources;

import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Getter
@Setter
@Builder
public class ResourceResponseDto {

    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private LocalTime availabilityStart;
    private LocalTime availabilityEnd;
    private ResourceStatus status;
    private String description;
    private Boolean deleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ResourceImageResponseDto> images;
}