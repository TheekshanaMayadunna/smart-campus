package com.smartcampus.service.resources;

<<<<<<< Updated upstream
import com.smartcampus.dto.resources.ResourceResponseDto;
import com.smartcampus.dto.resources.ResourceRequestDto;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ResourceService {

    ResourceResponseDto createResource(ResourceRequestDto requestDto);

    List<ResourceResponseDto> getAllResources(String name, String location, String type, Integer capacity, String status);

    ResourceResponseDto getResourceById(Long id);

    ResourceResponseDto updateResource(Long id, ResourceRequestDto requestDto);

    void deleteResource(Long id);

    ResourceResponseDto updateResourceStatus(Long id, String status);

    ResourceResponseDto uploadImage(Long resourceId, MultipartFile file);

    void deleteImage(Long resourceId, Long imageId);
}
=======
import com.smartcampus.dto.resources.ResourceAnalyticsDTO;
import com.smartcampus.dto.resources.ResourceRequestDTO;
import com.smartcampus.dto.resources.ResourceResponseDTO;
import com.smartcampus.model.booking.Booking;
import com.smartcampus.model.resources.Resource;
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import com.smartcampus.repository.booking.BookingRepository;
import com.smartcampus.repository.resources.ResourceRepository;
import com.smartcampus.service.FileStorageService;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ResourceService {
    private static final EnumSet<ResourceType> EQUIPMENT_TYPES = EnumSet.of(ResourceType.PROJECTOR, ResourceType.CAMERA, ResourceType.EQUIPMENT);
    private static final int DEFAULT_EQUIPMENT_CAPACITY = 1;
    private static final String DEFAULT_EQUIPMENT_LOCATION = "N/A";

    private final ResourceRepository resourceRepository;
    private final BookingRepository bookingRepository;
    private final FileStorageService fileStorageService;

    public ResourceResponseDTO create(ResourceRequestDTO dto) {
        validateAvailability(dto.getAvailabilityStart(), dto.getAvailabilityEnd());
        Resource entity = toEntity(new Resource(), dto);
        return toResponse(resourceRepository.save(entity));
    }

    public Page<ResourceResponseDTO> search(
            ResourceType type,
            Integer minCapacity,
            String location,
            ResourceStatus status,
            String q,
            int page,
            int size,
            String sortBy,
            String sortDir
    ) {
        Sort sort = Sort.by("desc".equalsIgnoreCase(sortDir) ? Sort.Direction.DESC : Sort.Direction.ASC, normalizeSort(sortBy));
        Pageable pageable = PageRequest.of(Math.max(page, 0), Math.max(size, 1), sort);

        return resourceRepository.findAll((root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.isFalse(root.get("deleted")));
            if (type != null) {
                predicates.add(cb.equal(root.get("type"), type));
            }
            if (minCapacity != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("capacity"), minCapacity));
            }
            if (location != null && !location.isBlank()) {
                predicates.add(cb.like(cb.lower(root.get("location")), "%" + location.toLowerCase() + "%"));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (q != null && !q.isBlank()) {
                String queryText = "%" + q.toLowerCase() + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("name")), queryText),
                        cb.like(cb.lower(root.get("location")), queryText),
                        cb.like(cb.lower(root.get("description")), queryText)
                ));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        }, pageable).map(this::toResponse);
    }

    public ResourceResponseDTO getById(Long id) {
        Resource resource = getActiveResource(id);
        return toResponse(resource);
    }

    public ResourceResponseDTO update(Long id, ResourceRequestDTO dto) {
        validateAvailability(dto.getAvailabilityStart(), dto.getAvailabilityEnd());
        Resource existing = getActiveResource(id);
        return toResponse(resourceRepository.save(toEntity(existing, dto)));
    }

    public void softDelete(Long id) {
        Resource existing = getActiveResource(id);
        existing.setDeleted(true);
        existing.setStatus(ResourceStatus.INACTIVE);
        resourceRepository.save(existing);
    }

    public ResourceResponseDTO setStatus(Long id, ResourceStatus status) {
        Resource resource = getActiveResource(id);
        resource.setStatus(status);
        return toResponse(resourceRepository.save(resource));
    }

    public ResourceResponseDTO uploadImage(Long id, MultipartFile image) {
        Resource resource = getActiveResource(id);
        String path = fileStorageService.storeResourceImage(image);
        resource.setImageUrl(path);
        return toResponse(resourceRepository.save(resource));
    }

    public Map<String, Object> analytics() {
        List<Resource> resources = resourceRepository.findAll((root, query, cb) -> cb.isFalse(root.get("deleted")));
        List<Booking> bookings = bookingRepository.findAllByOrderByCreatedAtDesc();

        List<ResourceAnalyticsDTO> usageByType = bookings.stream()
                .filter(b -> b.getResource() != null && b.getResource().getType() != null)
                .collect(Collectors.groupingBy(b -> b.getResource().getType().name(), Collectors.counting()))
                .entrySet()
                .stream()
                .map(e -> new ResourceAnalyticsDTO(e.getKey(), e.getValue()))
                .toList();

        String mostUsedEquipment = findMostBy(resources, r -> r.getType() == ResourceType.PROJECTOR || r.getType() == ResourceType.CAMERA, Resource::getName);
        String mostBookedRoom = findMostBy(bookings.stream().map(Booking::getResource).filter(r -> r != null &&
                (r.getType() == ResourceType.LAB || r.getType() == ResourceType.LECTURE_HALL || r.getType() == ResourceType.MEETING_ROOM)).toList(), r -> true, Resource::getName);
        String topLocation = findMostBy(resources, r -> true, Resource::getLocation);

        return Map.of(
                "totalResources", resources.size(),
                "activeResources", resources.stream().filter(r -> r.getStatus() == ResourceStatus.ACTIVE).count(),
                "outOfServiceResources", resources.stream().filter(r -> r.getStatus() == ResourceStatus.OUT_OF_SERVICE).count(),
                "usageByType", usageByType,
                "mostUsedEquipment", mostUsedEquipment,
                "mostBookedRoom", mostBookedRoom,
                "mostCommonLocation", topLocation
        );
    }

    private <T> String findMostBy(List<T> source, java.util.function.Predicate<T> include, Function<T, String> classifier) {
        return source.stream()
                .filter(include)
                .map(classifier)
                .filter(v -> v != null && !v.isBlank())
                .collect(Collectors.groupingBy(Function.identity(), Collectors.counting()))
                .entrySet()
                .stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("N/A");
    }

    private Resource getActiveResource(Long id) {
        return resourceRepository.findById(id)
                .filter(r -> !r.isDeleted())
                .orElseThrow(() -> new RuntimeException("Resource not found: " + id));
    }

    private Resource toEntity(Resource resource, ResourceRequestDTO dto) {
        resource.setName(dto.getName().trim());
        resource.setType(dto.getType());

        if (dto.getType() != null && EQUIPMENT_TYPES.contains(dto.getType())) {
            resource.setCapacity(DEFAULT_EQUIPMENT_CAPACITY);
            resource.setLocation(DEFAULT_EQUIPMENT_LOCATION);
        } else {
            resource.setCapacity(dto.getCapacity());
            resource.setLocation(dto.getLocation().trim());
        }

        resource.setAvailabilityStart(dto.getAvailabilityStart());
        resource.setAvailabilityEnd(dto.getAvailabilityEnd());
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());
        resource.setImageUrl(dto.getImageUrl());
        return resource;
    }

    private ResourceResponseDTO toResponse(Resource resource) {
        return ResourceResponseDTO.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .availabilityStart(resource.getAvailabilityStart())
                .availabilityEnd(resource.getAvailabilityEnd())
                .status(resource.getStatus())
                .description(resource.getDescription())
                .imageUrl(resource.getImageUrl())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .build();
    }

    private void validateAvailability(LocalTime start, LocalTime end) {
        if (start == null || end == null) {
            throw new RuntimeException("Availability start and end are required");
        }
        if (!end.isAfter(start)) {
            throw new RuntimeException("Availability start must be before availability end");
        }
    }

    private String normalizeSort(String sortBy) {
        List<String> allowed = List.of("id", "name", "type", "capacity", "location", "status", "createdAt", "updatedAt");
        return allowed.contains(sortBy) ? sortBy : "createdAt";
    }
}
>>>>>>> Stashed changes
