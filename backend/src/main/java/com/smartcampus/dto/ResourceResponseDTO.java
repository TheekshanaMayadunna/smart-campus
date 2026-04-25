// backend/src/main/java/com/smartcampus/dto/ResourceResponseDTO.java
package com.smartcampus.dto;

import com.smartcampus.model.ResourceType;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class ResourceResponseDTO {
    private Long id;
    private String name;
    private ResourceType type;
    private Integer capacity;
    private String location;
    private String status;
    private String availabilityWindows;
}