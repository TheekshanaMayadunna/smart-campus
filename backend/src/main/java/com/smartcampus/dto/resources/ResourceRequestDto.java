package com.smartcampus.dto.resources;

import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceRequestDTO {
    @NotBlank
    @Size(max = 120)
    private String name;

    @NotNull
    private ResourceType type;

    @NotNull
    @Min(0)
    private Integer capacity;

    @NotBlank
    @Size(max = 120)
    private String location;

    @NotNull
    private LocalTime availabilityStart;

    @NotNull
    private LocalTime availabilityEnd;

    @NotNull
    private ResourceStatus status;

    @Size(max = 500)
    private String description;

    @Size(max = 512)
    private String imageUrl;
}
