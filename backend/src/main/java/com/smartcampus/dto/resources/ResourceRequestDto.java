package com.smartcampus.dto.resources;

import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
public class ResourceRequestDto {

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Type is required")
    private ResourceType type;

    @NotNull(message = "Capacity is required")
    @Min(value = 0, message = "Capacity cannot be negative")
    private Integer capacity;

    @NotBlank(message = "Location is required")
    private String location;

    @NotNull(message = "Availability start is required")
    private LocalTime availabilityStart;

    @NotNull(message = "Availability end is required")
    private LocalTime availabilityEnd;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private String description;
}