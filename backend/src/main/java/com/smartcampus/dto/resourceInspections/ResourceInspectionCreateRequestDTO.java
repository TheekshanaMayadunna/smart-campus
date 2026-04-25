package com.smartcampus.dto.resourceInspections;

import com.smartcampus.model.resourceInspections.AssetCondition;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ResourceInspectionCreateRequestDTO {
    @NotNull
    @PastOrPresent
    private LocalDate inspectionDate;

    @Size(max = 120)
    private String inspectorName;

    @NotNull
    private AssetCondition conditionAtInspection;

    @NotNull
    private InspectionStatus inspectionStatus;

    @Size(max = 1000)
    private String remarks;

    @Size(max = 1000)
    private String actionRequired;

    private LocalDate nextInspectionDate;
}

