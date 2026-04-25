package com.smartcampus.repository.resourceInspections;

import com.smartcampus.model.resourceInspections.ResourceAssetProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface ResourceAssetProfileRepository extends JpaRepository<ResourceAssetProfile, Long> {
    Optional<ResourceAssetProfile> findByResourceId(Long resourceId);

    Optional<ResourceAssetProfile> findByQrCodeValue(String qrCodeValue);

    boolean existsByQrCodeValue(String qrCodeValue);

    boolean existsByAssetCode(String assetCode);

    boolean existsByAssetCodeAndIdNot(String assetCode, Long id);

    boolean existsBySerialNumber(String serialNumber);

    boolean existsBySerialNumberAndIdNot(String serialNumber, Long id);

    List<ResourceAssetProfile> findByNextInspectionDateBefore(LocalDate date);
}
