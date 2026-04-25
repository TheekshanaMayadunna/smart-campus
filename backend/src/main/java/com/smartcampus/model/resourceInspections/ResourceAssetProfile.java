package com.smartcampus.model.resourceInspections;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "resource_asset_profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceAssetProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resource_id", nullable = false, unique = true)
    private Long resourceId;

    @Column(name = "asset_code", nullable = false, unique = true, length = 80)
    private String assetCode;

    @Column(name = "serial_number", unique = true, length = 120)
    private String serialNumber;

    @Column(length = 120)
    private String manufacturer;

    @Column(name = "model_number", length = 120)
    private String modelNumber;

    @Column(name = "purchase_date")
    private LocalDate purchaseDate;

    @Column(name = "warranty_expiry_date")
    private LocalDate warrantyExpiryDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "current_condition", length = 20)
    private AssetCondition currentCondition;

    @Enumerated(EnumType.STRING)
    @Column(name = "inspection_status", length = 20)
    private InspectionStatus inspectionStatus;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    @Column(length = 1000)
    private String notes;

    @Column(name = "qr_code_value", nullable = false, unique = true, length = 120)
    private String qrCodeValue;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
