package com.smartcampus.service.resources;

import com.smartcampus.dto.resources.ResourceImageResponseDto;
import com.smartcampus.dto.resources.ResourceRequestDto;
import com.smartcampus.dto.resources.ResourceResponseDto;
import com.smartcampus.model.resources.Resource;
import com.smartcampus.model.resources.ResourceImage;
import com.smartcampus.model.resources.ResourceStatus;
import com.smartcampus.model.resources.ResourceType;
import com.smartcampus.repository.resources.ResourceImageRepository;
import com.smartcampus.repository.resources.ResourceRepository;
import jakarta.persistence.criteria.Predicate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ResourceServiceImpl implements ResourceService {

    private final ResourceRepository resourceRepository;
    private final ResourceImageRepository resourceImageRepository;

    @Value("${app.upload.dir}")
    private String uploadDir;

    @Value("${app.base.url}")
    private String baseUrl;

    public ResourceServiceImpl(ResourceRepository resourceRepository, ResourceImageRepository resourceImageRepository) {
        this.resourceRepository = resourceRepository;
        this.resourceImageRepository = resourceImageRepository;
    }

    @Override
    public ResourceResponseDto createResource(ResourceRequestDto requestDto) {
        validateAvailability(requestDto);

        Resource resource = new Resource();
        mapToEntity(requestDto, resource);

        Resource saved = resourceRepository.save(resource);
        return mapToResponse(saved);
    }

    @Override
    public List<ResourceResponseDto> getAllResources(String name, String location, String type, Integer capacity, String status) {
        Specification<Resource> specification = (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(criteriaBuilder.isFalse(root.get("deleted")));

            if (name != null && !name.isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("name")),
                        "%" + name.toLowerCase() + "%"
                ));
            }

            if (location != null && !location.isBlank()) {
                predicates.add(criteriaBuilder.like(
                        criteriaBuilder.lower(root.get("location")),
                        "%" + location.toLowerCase() + "%"
                ));
            }

            if (type != null && !type.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("type"), ResourceType.valueOf(type.toUpperCase())));
            }

            if (capacity != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("capacity"), capacity));
            }

            if (status != null && !status.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("status"), ResourceStatus.valueOf(status.toUpperCase())));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };

        return resourceRepository.findAll(specification)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public ResourceResponseDto getResourceById(Long id) {
        Resource resource = getExistingResource(id);
        return mapToResponse(resource);
    }

    @Override
    public ResourceResponseDto updateResource(Long id, ResourceRequestDto requestDto) {
        validateAvailability(requestDto);

        Resource resource = getExistingResource(id);
        mapToEntity(requestDto, resource);

        Resource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Override
    public void deleteResource(Long id) {
        Resource resource = getExistingResource(id);
        resource.setDeleted(true);
        resourceRepository.save(resource);
    }

    @Override
    public ResourceResponseDto updateResourceStatus(Long id, String status) {
        Resource resource = getExistingResource(id);
        resource.setStatus(ResourceStatus.valueOf(status.toUpperCase()));
        Resource updated = resourceRepository.save(resource);
        return mapToResponse(updated);
    }

    @Override
    public ResourceResponseDto uploadImage(Long resourceId, MultipartFile file) {
        Resource resource = getExistingResource(resourceId);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Image file is required");
        }

        String contentType = file.getContentType();
        if (contentType == null ||
                !(MediaType.IMAGE_JPEG_VALUE.equals(contentType)
                        || MediaType.IMAGE_PNG_VALUE.equals(contentType)
                        || "image/jpg".equals(contentType)
                        || "image/webp".equals(contentType))) {
            throw new IllegalArgumentException("Only JPG, JPEG, PNG, and WEBP images are allowed");
        }

        try {
            String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
            String extension = getExtension(originalFileName);
            String storedFileName = UUID.randomUUID() + extension;

            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);

            Path targetPath = uploadPath.resolve(storedFileName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            ResourceImage resourceImage = new ResourceImage();
            resourceImage.setOriginalFileName(originalFileName);
            resourceImage.setStoredFileName(storedFileName);
            resourceImage.setFileType(contentType);
            resourceImage.setFileSize(file.getSize());
            resourceImage.setImageUrl(baseUrl + "/uploads/resource-images/" + storedFileName);
            resourceImage.setResource(resource);

            resourceImageRepository.save(resourceImage);

            Resource updatedResource = getExistingResource(resourceId);
            return mapToResponse(updatedResource);

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload image", e);
        }
    }

    @Override
    public void deleteImage(Long resourceId, Long imageId) {
        Resource resource = getExistingResource(resourceId);

        ResourceImage image = resourceImageRepository.findById(imageId)
                .orElseThrow(() -> new IllegalArgumentException("Image not found"));

        if (!image.getResource().getId().equals(resource.getId())) {
            throw new IllegalArgumentException("Image does not belong to this resource");
        }

        try {
            Path filePath = Paths.get(uploadDir).resolve(image.getStoredFileName());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Failed to delete image file", e);
        }

        resourceImageRepository.delete(image);
    }

    private Resource getExistingResource(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Resource not found with id: " + id));

        if (Boolean.TRUE.equals(resource.getDeleted())) {
            throw new IllegalArgumentException("Resource not found with id: " + id);
        }

        return resource;
    }

    private void validateAvailability(ResourceRequestDto requestDto) {
        if (requestDto.getAvailabilityStart() != null
                && requestDto.getAvailabilityEnd() != null
                && !requestDto.getAvailabilityStart().isBefore(requestDto.getAvailabilityEnd())) {
            throw new IllegalArgumentException("Availability start must be before availability end");
        }
    }

    private void mapToEntity(ResourceRequestDto dto, Resource resource) {
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setLocation(dto.getLocation());
        resource.setAvailabilityStart(dto.getAvailabilityStart());
        resource.setAvailabilityEnd(dto.getAvailabilityEnd());
        resource.setStatus(dto.getStatus());
        resource.setDescription(dto.getDescription());
    }

    private ResourceResponseDto mapToResponse(Resource resource) {
        List<ResourceImageResponseDto> imageDtos = resource.getImages() == null
                ? new ArrayList<>()
                : resource.getImages().stream().map(image -> ResourceImageResponseDto.builder()
                .id(image.getId())
                .originalFileName(image.getOriginalFileName())
                .storedFileName(image.getStoredFileName())
                .fileType(image.getFileType())
                .fileSize(image.getFileSize())
                .imageUrl(image.getImageUrl())
                .uploadedAt(image.getUploadedAt())
                .build()
        ).toList();

        return ResourceResponseDto.builder()
                .id(resource.getId())
                .name(resource.getName())
                .type(resource.getType())
                .capacity(resource.getCapacity())
                .location(resource.getLocation())
                .availabilityStart(resource.getAvailabilityStart())
                .availabilityEnd(resource.getAvailabilityEnd())
                .status(resource.getStatus())
                .description(resource.getDescription())
                .deleted(resource.getDeleted())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .images(imageDtos)
                .build();
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf("."));
    }
}