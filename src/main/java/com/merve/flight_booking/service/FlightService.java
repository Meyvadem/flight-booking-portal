package com.merve.flight_booking.service;

import com.merve.flight_booking.dto.FlightSearchResponse;
import com.merve.flight_booking.dto.RoundTripFlightResponse;
import com.merve.flight_booking.entity.Flight;
import com.merve.flight_booking.repository.FlightRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class FlightService {

    private final FlightRepository flightRepository;

    public FlightService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    public RoundTripFlightResponse searchFlights(
            String from,
            String to,
            LocalDate departureDate,
            LocalDate returnDate
    ) {

        from = from.toUpperCase();
        to = to.toUpperCase();

        // === GİDİŞ ===
        LocalDateTime depStart = departureDate.atStartOfDay();
        LocalDateTime depEnd = departureDate.plusDays(1).atStartOfDay();

        List<FlightSearchResponse> outbound =
                flightRepository.searchFlights(from, to, depStart, depEnd)
                        .stream()
                        .map(this::toDto)
                        .toList();

        // === DÖNÜŞ ===
        List<FlightSearchResponse> inbound = List.of();

        if (returnDate != null) {
            LocalDateTime retStart = returnDate.atStartOfDay();
            LocalDateTime retEnd = returnDate.plusDays(1).atStartOfDay();

            inbound =
                    flightRepository.searchFlights(to, from, retStart, retEnd)
                            .stream()
                            .map(this::toDto)
                            .toList();
        }

        RoundTripFlightResponse response = new RoundTripFlightResponse();
        response.setOutboundFlights(outbound);
        response.setReturnFlights(inbound);

        return response;
    }


    private FlightSearchResponse toDto(Flight f) {
        FlightSearchResponse dto = new FlightSearchResponse();
        dto.setFlightId(f.getId());
        dto.setFlightNumber(f.getFlightNumber());
        dto.setAirlineCode(f.getAirline().getCode());
        dto.setAirlineName(f.getAirline().getName());
        dto.setFrom(f.getDepartureAirport().getCode());
        dto.setTo(f.getArrivalAirport().getCode());
        dto.setDepartureTime(f.getDepartureTime());
        dto.setArrivalTime(f.getArrivalTime());
        dto.setBasePrice(f.getBasePrice());
        return dto;
    }

}
