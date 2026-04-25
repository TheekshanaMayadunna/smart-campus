package com.smartcampus.model.resources;

<<<<<<< Updated upstream
import jakarta.persistence.CascadeType;
=======
>>>>>>> Stashed changes
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
<<<<<<< Updated upstream
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
=======
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
>>>>>>> Stashed changes
import lombok.Setter;

import java.time.LocalDateTime;
import java.time.LocalTime;
<<<<<<< Updated upstream
import java.util.ArrayList;
import java.util.List;
=======
>>>>>>> Stashed changes

@Entity
@Table(name = "resources")
@Getter
@Setter
<<<<<<< Updated upstream
public class Resource {

=======
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {
>>>>>>> Stashed changes
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

<<<<<<< Updated upstream
    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
=======
    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
>>>>>>> Stashed changes
    private ResourceType type;

    @Column(nullable = false)
    private Integer capacity;

<<<<<<< Updated upstream
    @Column(nullable = false)
=======
    @Column(nullable = false, length = 120)
>>>>>>> Stashed changes
    private String location;

    @Column(nullable = false)
    private LocalTime availabilityStart;

    @Column(nullable = false)
    private LocalTime availabilityEnd;

    @Enumerated(EnumType.STRING)
<<<<<<< Updated upstream
    @Column(nullable = false)
    private ResourceStatus status;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Boolean deleted = false;
=======
    @Column(nullable = false, length = 30)
    private ResourceStatus status;

    @Column(length = 500)
    private String description;

    @Column(length = 512)
    private String imageUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean deleted = false;
>>>>>>> Stashed changes

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

<<<<<<< Updated upstream
    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ResourceImage> images = new ArrayList<>();

    @PrePersist
    public void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.deleted == null) {
            this.deleted = false;
        }
    }

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
=======
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
>>>>>>> Stashed changes
