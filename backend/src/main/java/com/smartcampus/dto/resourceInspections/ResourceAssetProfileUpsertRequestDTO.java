package com.smartcampus.dto.resourceInspections;

import com.smartcampus.model.resourceInspections.AssetCondition;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import jakarta.validation.constraints.NotBlank;
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
public class ResourceAssetProfileUpsertRequestDTO {
    @NotBlank
    @Size(max = 80)
    private String assetCode;

    @Size(max = 120)
    private String serialNumber;

    @Size(max = 120)
    private String manufacturer;

    @Size(max = 120)
    private String modelNumber;

    @PastOrPresent
    private LocalDate purchaseDate;

    private LocalDate warrantyExpiryDate;

    @NotNull
    private AssetCondition currentCondition;

    @NotNull
    private InspectionStatus inspectionStatus;

    private LocalDate lastInspectionDate;

    private LocalDate nextInspectionDate;

    @Size(max = 1000)
    private String notes;
}
