package com.smartcampus.dto.resourceInspections;

import com.smartcampus.model.resourceInspections.AssetCondition;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OverdueInspectionResponseDTO {
    private Long resourceId;
    private String resourceName;
    private LocalDate nextInspectionDate;
    private InspectionStatus inspectionStatus;
    private AssetCondition currentCondition;
    private String qrCodeValue;
}

