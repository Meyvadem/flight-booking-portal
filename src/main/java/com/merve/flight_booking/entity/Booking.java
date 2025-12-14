package com.merve.flight_booking.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "flight_id")
    private Flight flight;

    @ManyToOne
    @JoinColumn(name = "fare_type_id")
    private FareType fareType;

    private int extraBaggageKg;

    private double totalPrice;

    @Enumerated(EnumType.STRING)
    private BookingStatus status;

    private LocalDateTime bookingDate = LocalDateTime.now();

    // getters & setters
}
