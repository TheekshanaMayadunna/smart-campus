package com.smartcampus.service.resources;

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