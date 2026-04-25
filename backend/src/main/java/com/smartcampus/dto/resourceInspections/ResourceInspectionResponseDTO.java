package com.smartcampus.dto.resourceInspections;

import com.smartcampus.model.resourceInspections.AssetCondition;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceInspectionResponseDTO {
    private Long id;
    private Long resourceId;
    private LocalDate inspectionDate;
    private String inspectorName;
    private AssetCondition conditionAtInspection;
    private InspectionStatus inspectionStatus;
    private String remarks;
    private String actionRequired;
    private LocalDateTime createdAt;
}

