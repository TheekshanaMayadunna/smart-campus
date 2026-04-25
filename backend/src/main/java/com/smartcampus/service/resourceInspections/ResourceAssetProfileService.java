package com.smartcampus.service.resourceInspections;

import com.smartcampus.dto.resourceInspections.ResourceAssetProfileResponseDTO;
import com.smartcampus.dto.resourceInspections.ResourceAssetProfileUpsertRequestDTO;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import com.smartcampus.model.resourceInspections.ResourceAssetProfile;
import com.smartcampus.model.resources.Resource;
import com.smartcampus.model.resources.ResourceType;
import com.smartcampus.repository.resourceInspections.ResourceAssetProfileRepository;
import com.smartcampus.repository.resources.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.EnumSet;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ResourceAssetProfileService {
    private static final EnumSet<ResourceType> EQUIPMENT_TYPES = EnumSet.of(ResourceType.PROJECTOR, ResourceType.CAMERA, ResourceType.EQUIPMENT);

    private final ResourceAssetProfileRepository profileRepository;
    private final ResourceRepository resourceRepository;

    public ResourceAssetProfileResponseDTO create(Long resourceId, ResourceAssetProfileUpsertRequestDTO dto) {
        Resource resource = getActiveResource(resourceId);
        if (profileRepository.findByResourceId(resourceId).isPresent()) {
            throw new RuntimeException("Asset profile already exists for resource: " + resourceId);
        }

        validateUpsert(resource, dto);
        validateUniquenessOnCreate(dto);
        ResourceAssetProfile profile = new ResourceAssetProfile();
        profile.setResourceId(resourceId);
        profile.setQrCodeValue(generateUniqueQrCodeValue(resourceId));

        apply(profile, dto, true);
        return toResponse(profileRepository.save(profile));
    }

    public ResourceAssetProfileResponseDTO getByResourceId(Long resourceId) {
        ResourceAssetProfile profile = profileRepository.findByResourceId(resourceId)
                .orElseThrow(() -> new RuntimeException("Asset profile not found for resource: " + resourceId));

        refreshOverdueStatus(profile);
        return toResponse(profile);
    }

    public ResourceAssetProfileResponseDTO update(Long resourceId, ResourceAssetProfileUpsertRequestDTO dto) {
        Resource resource = getActiveResource(resourceId);
        ResourceAssetProfile profile = profileRepository.findByResourceId(resourceId)
                .orElseThrow(() -> new RuntimeException("Asset profile not found for resource: " + resourceId));

        validateUpsert(resource, dto);
        validateUniquenessOnUpdate(profile.getId(), dto);
        apply(profile, dto, false);
        refreshOverdueStatus(profile);
        return toResponse(profileRepository.save(profile));
    }

    public ResourceAssetProfileResponseDTO setInspectionStatus(Long resourceId, InspectionStatus status) {
        if (status == null) {
            throw new RuntimeException("Inspection status is required");
        }
        ResourceAssetProfile profile = profileRepository.findByResourceId(resourceId)
                .orElseThrow(() -> new RuntimeException("Asset profile not found for resource: " + resourceId));
        profile.setInspectionStatus(status);
        return toResponse(profileRepository.save(profile));
    }

    public void deleteByResourceId(Long resourceId) {
        ResourceAssetProfile profile = profileRepository.findByResourceId(resourceId)
                .orElseThrow(() -> new RuntimeException("Asset profile not found for resource: " + resourceId));
        profileRepository.delete(profile);
    }

    public ResourceAssetProfileResponseDTO getByQrCodeValue(String qrCodeValue) {
        if (qrCodeValue == null || qrCodeValue.isBlank()) {
            throw new RuntimeException("QR code value is required");
        }

        ResourceAssetProfile profile = profileRepository.findByQrCodeValue(qrCodeValue.trim())
                .orElseThrow(() -> new RuntimeException("Asset profile not found for QR: " + qrCodeValue));

        refreshOverdueStatus(profile);
        return toResponse(profile);
    }

    private void validateUpsert(Resource resource, ResourceAssetProfileUpsertRequestDTO dto) {
        if (dto == null) {
            throw new RuntimeException("Request body is required");
        }
        if (dto.getAssetCode() == null || dto.getAssetCode().isBlank()) {
            throw new RuntimeException("Asset code cannot be empty");
        }

        if (dto.getCurrentCondition() == null) {
            throw new RuntimeException("Condition is required");
        }

        if (dto.getInspectionStatus() == null) {
            throw new RuntimeException("Inspection status is required");
        }

        if (EQUIPMENT_TYPES.contains(resource.getType())) {
            if (dto.getSerialNumber() == null || dto.getSerialNumber().isBlank()) {
                throw new RuntimeException("Serial number is required for equipment resources");
            }
        }

        LocalDate purchaseDate = dto.getPurchaseDate();
        if (purchaseDate != null && purchaseDate.isAfter(LocalDate.now())) {
            throw new RuntimeException("Purchase date cannot be in the future");
        }

        LocalDate warrantyExpiry = dto.getWarrantyExpiryDate();
        if (purchaseDate != null && warrantyExpiry != null && !warrantyExpiry.isAfter(purchaseDate)) {
            throw new RuntimeException("Warranty expiry must be after purchase date");
        }

        LocalDate lastInspection = dto.getLastInspectionDate();
        LocalDate nextInspection = dto.getNextInspectionDate();
        if (lastInspection != null && lastInspection.isAfter(LocalDate.now())) {
            throw new RuntimeException("Last inspection date cannot be in the future");
        }
        if (lastInspection != null && nextInspection != null && !nextInspection.isAfter(lastInspection)) {
            throw new RuntimeException("Next inspection date must be after last inspection date");
        }
    }

    private void validateUniquenessOnCreate(ResourceAssetProfileUpsertRequestDTO dto) {
        String assetCode = dto.getAssetCode().trim();
        if (profileRepository.existsByAssetCode(assetCode)) {
            throw new RuntimeException("Asset code must be unique");
        }

        String serialNumber = normalizeOptional(dto.getSerialNumber());
        if (serialNumber != null && profileRepository.existsBySerialNumber(serialNumber)) {
            throw new RuntimeException("Serial number must be unique");
        }
    }

    private void validateUniquenessOnUpdate(Long profileId, ResourceAssetProfileUpsertRequestDTO dto) {
        String assetCode = dto.getAssetCode().trim();
        if (profileRepository.existsByAssetCodeAndIdNot(assetCode, profileId)) {
            throw new RuntimeException("Asset code must be unique");
        }

        String serialNumber = normalizeOptional(dto.getSerialNumber());
        if (serialNumber != null && profileRepository.existsBySerialNumberAndIdNot(serialNumber, profileId)) {
            throw new RuntimeException("Serial number must be unique");
        }
    }

    private void apply(ResourceAssetProfile profile, ResourceAssetProfileUpsertRequestDTO dto, boolean isCreate) {
        profile.setAssetCode(dto.getAssetCode().trim());
        profile.setSerialNumber(normalizeOptional(dto.getSerialNumber()));
        profile.setManufacturer(normalizeOptional(dto.getManufacturer()));
        profile.setModelNumber(normalizeOptional(dto.getModelNumber()));
        profile.setPurchaseDate(dto.getPurchaseDate());
        profile.setWarrantyExpiryDate(dto.getWarrantyExpiryDate());
        profile.setCurrentCondition(dto.getCurrentCondition());
        profile.setInspectionStatus(dto.getInspectionStatus());
        profile.setLastInspectionDate(dto.getLastInspectionDate());
        profile.setNextInspectionDate(dto.getNextInspectionDate());
        profile.setNotes(normalizeOptional(dto.getNotes()));

        if (isCreate) {
            // inspectionStatus/currentCondition are required by validation.
        }
    }

    private boolean refreshOverdueStatus(ResourceAssetProfile profile) {
        if (profile.getNextInspectionDate() == null) {
            return false;
        }
        boolean isOverdue = profile.getNextInspectionDate().isBefore(LocalDate.now());
        if (isOverdue && profile.getInspectionStatus() != InspectionStatus.FAILED && profile.getInspectionStatus() != InspectionStatus.OVERDUE) {
            profile.setInspectionStatus(InspectionStatus.OVERDUE);
            profileRepository.save(profile);
            return true;
        }
        return false;
    }

    private String generateUniqueQrCodeValue(Long resourceId) {
        for (int attempt = 0; attempt < 10; attempt++) {
            String value = "RA-" + resourceId + "-" + UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase();
            if (!profileRepository.existsByQrCodeValue(value)) {
                return value;
            }
        }
        throw new RuntimeException("Unable to generate unique QR value");
    }

    private Resource getActiveResource(Long id) {
        return resourceRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }

    private ResourceAssetProfileResponseDTO toResponse(ResourceAssetProfile profile) {
        return ResourceAssetProfileResponseDTO.builder()
                .id(profile.getId())
                .resourceId(profile.getResourceId())
                .assetCode(profile.getAssetCode())
                .serialNumber(profile.getSerialNumber())
                .manufacturer(profile.getManufacturer())
                .modelNumber(profile.getModelNumber())
                .purchaseDate(profile.getPurchaseDate())
                .warrantyExpiryDate(profile.getWarrantyExpiryDate())
                .currentCondition(profile.getCurrentCondition())
                .inspectionStatus(profile.getInspectionStatus())
                .lastInspectionDate(profile.getLastInspectionDate())
                .nextInspectionDate(profile.getNextInspectionDate())
                .notes(profile.getNotes())
                .qrCodeValue(profile.getQrCodeValue())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
