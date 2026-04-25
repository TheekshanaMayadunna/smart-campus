package com.smartcampus.dto;

import org.springframework.web.multipart.MultipartFile;

public class TicketRequestDTO {
    private String resourceLocation;
    private String category;
    private String description;
    private String priority;
    private String preferredContact;
    private MultipartFile[] images;

    public String getResourceLocation() { return resourceLocation; }
    public void setResourceLocation(String resourceLocation) { this.resourceLocation = resourceLocation; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getPreferredContact() { return preferredContact; }
    public void setPreferredContact(String preferredContact) { this.preferredContact = preferredContact; }
    public MultipartFile[] getImages() { return images; }
    public void setImages(MultipartFile[] images) { this.images = images; }
}
