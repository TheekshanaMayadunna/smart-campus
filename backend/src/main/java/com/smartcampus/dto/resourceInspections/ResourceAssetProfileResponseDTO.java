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
public class ResourceAssetProfileResponseDTO {
    private Long id;
    private Long resourceId;
    private String assetCode;
    private String serialNumber;
    private String manufacturer;
    private String modelNumber;
    private LocalDate purchaseDate;
    private LocalDate warrantyExpiryDate;
    private AssetCondition currentCondition;
    private InspectionStatus inspectionStatus;
    private LocalDate lastInspectionDate;
    private LocalDate nextInspectionDate;
    private String notes;
    private String qrCodeValue;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

