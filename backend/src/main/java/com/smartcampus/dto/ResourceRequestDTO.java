package com.smartcampus.dto;

import com.smartcampus.model.ResourceType;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ResourceRequestDTO {

    @NotBlank
    @Size(max=120)
    private String name;

    @NotNull
    private ResourceType type;

    @NotNull
    @Min(0)
    private Integer capacity;

    @NotBlank
    @Size(max=120)
    private String location;

    @NotBlank
    @Pattern(regexp = "ACTIVE|OUT_OF_SERVICE|INACTIVE",
             message = "status must be ACTIVE, OUT_OF_SERVICE or INACTIVE")
    private String status;

    @Size(max=255)
    private String availabilityWindows;
}