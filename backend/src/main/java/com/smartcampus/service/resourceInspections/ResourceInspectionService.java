package com.smartcampus.service.resourceInspections;

import com.smartcampus.dto.resourceInspections.OverdueInspectionResponseDTO;
import com.smartcampus.dto.resourceInspections.ResourceInspectionCreateRequestDTO;
import com.smartcampus.dto.resourceInspections.ResourceInspectionResponseDTO;
import com.smartcampus.model.resourceInspections.InspectionStatus;
import com.smartcampus.model.resourceInspections.ResourceAssetProfile;
import com.smartcampus.model.resourceInspections.ResourceInspection;
import com.smartcampus.model.resources.Resource;
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.repository.resourceInspections.ResourceAssetProfileRepository;
import com.smartcampus.repository.resourceInspections.ResourceInspectionRepository;
import com.smartcampus.repository.resources.ResourceRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceInspectionService {
    private final ResourceInspectionRepository inspectionRepository;
    private final ResourceAssetProfileRepository profileRepository;
    private final ResourceRepository resourceRepository;

    @Transactional
    public ResourceInspectionResponseDTO addInspection(Long resourceId, ResourceInspectionCreateRequestDTO dto, String defaultInspectorName) {
        Resource resource = getActiveResource(resourceId);
        if (dto == null) {
            throw new RuntimeException("Request body is required");
        }

        ResourceAssetProfile profile = profileRepository.findByResourceId(resourceId)
                .orElseThrow(() -> new RuntimeException("Asset profile not found for resource: " + resourceId));

        if (dto.getInspectionDate() != null && dto.getInspectionDate().isAfter(LocalDate.now())) {
            throw new RuntimeException("Inspection date cannot be in the future");
        }

        if (dto.getNextInspectionDate() != null && dto.getInspectionDate() != null && !dto.getNextInspectionDate().isAfter(dto.getInspectionDate())) {
            throw new RuntimeException("Next inspection date must be after inspection date");
        }

        String inspector = normalizeOptional(dto.getInspectorName());
        if (inspector == null) {
            inspector = normalizeOptional(defaultInspectorName);
        }
        if (inspector == null) {
            throw new RuntimeException("Inspector name cannot be empty");
        }

        ResourceInspection inspection = ResourceInspection.builder()
                .resourceId(resourceId)
                .inspectionDate(dto.getInspectionDate())
                .inspectorName(inspector)
                .conditionAtInspection(dto.getConditionAtInspection())
                .inspectionStatus(dto.getInspectionStatus())
                .remarks(normalizeOptional(dto.getRemarks()))
                .actionRequired(normalizeOptional(dto.getActionRequired()))
                .build();

        ResourceInspection saved = inspectionRepository.save(inspection);

        profile.setLastInspectionDate(dto.getInspectionDate());
        profile.setCurrentCondition(dto.getConditionAtInspection());
        profile.setInspectionStatus(dto.getInspectionStatus());

        if (dto.getNextInspectionDate() != null) {
            profile.setNextInspectionDate(dto.getNextInspectionDate());
        } else if (profile.getNextInspectionDate() == null) {
            profile.setNextInspectionDate(dto.getInspectionDate().plusMonths(6));
        }

        profileRepository.save(profile);

        if (dto.getInspectionStatus() == InspectionStatus.FAILED) {
            resource.setStatus(ResourceStatus.OUT_OF_SERVICE);
            resourceRepository.save(resource);
        }

        return toResponse(saved);
    }

    public List<ResourceInspectionResponseDTO> listByResourceId(Long resourceId) {
        getActiveResource(resourceId);
        return inspectionRepository.findByResourceIdOrderByInspectionDateDesc(resourceId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public List<OverdueInspectionResponseDTO> listOverdue() {
        LocalDate today = LocalDate.now();
        List<ResourceAssetProfile> profiles = profileRepository.findByNextInspectionDateBefore(today);

        List<Long> resourceIds = profiles.stream().map(ResourceAssetProfile::getResourceId).distinct().toList();
        Map<Long, Resource> resourcesById = resourceRepository.findAllById(resourceIds)
                .stream()
                .filter(r -> r != null && !r.isDeleted())
                .collect(Collectors.toMap(Resource::getId, Function.identity(), (a, b) -> a));

        profiles.forEach(p -> {
            if (p.getInspectionStatus() != InspectionStatus.FAILED && p.getInspectionStatus() != InspectionStatus.OVERDUE) {
                p.setInspectionStatus(InspectionStatus.OVERDUE);
            }
        });
        profileRepository.saveAll(profiles);

        return profiles.stream()
                .map(p -> OverdueInspectionResponseDTO.builder()
                        .resourceId(p.getResourceId())
                        .resourceName(resourcesById.get(p.getResourceId()) == null ? "Unknown Resource" : resourcesById.get(p.getResourceId()).getName())
                        .nextInspectionDate(p.getNextInspectionDate())
                        .inspectionStatus(p.getInspectionStatus())
                        .currentCondition(p.getCurrentCondition())
                        .qrCodeValue(p.getQrCodeValue())
                        .build())
                .toList();
    }

    public void deleteInspection(Long inspectionId) {
        if (inspectionId == null) {
            throw new RuntimeException("Inspection id is required");
        }
        if (!inspectionRepository.existsById(inspectionId)) {
            throw new RuntimeException("Inspection not found: " + inspectionId);
        }
        inspectionRepository.deleteById(inspectionId);
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

    private ResourceInspectionResponseDTO toResponse(ResourceInspection inspection) {
        return ResourceInspectionResponseDTO.builder()
                .id(inspection.getId())
                .resourceId(inspection.getResourceId())
                .inspectionDate(inspection.getInspectionDate())
                .inspectorName(inspection.getInspectorName())
                .conditionAtInspection(inspection.getConditionAtInspection())
                .inspectionStatus(inspection.getInspectionStatus())
                .remarks(inspection.getRemarks())
                .actionRequired(inspection.getActionRequired())
                .createdAt(inspection.getCreatedAt())
                .build();
    }
}
