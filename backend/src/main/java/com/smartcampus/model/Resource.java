// backend/src/main/java/com/smartcampus/model/Resource.java
package com.smartcampus.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "resources")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Resource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, length=120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable=false, length=30)
    private ResourceType type;

    @Column(nullable=false)
    private Integer capacity;

    @Column(nullable=false, length=120)
    private String location;

    @Column(nullable=false, length=25)
    private String status; // ACTIVE / OUT_OF_SERVICE

    // ✅ FIX: map Java field -> DB column
    @Column(name = "availability_windows", length=255)
    private String availabilityWindows; // AVAILABLE / MAINTENANCE / UNAVAILABLE
}