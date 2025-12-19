package com.merve.flight_booking.service;

import com.merve.flight_booking.dto.AirportDto;
import com.merve.flight_booking.entity.Airport;
import com.merve.flight_booking.repository.AirportRepository;
import com.merve.flight_booking.repository.FlightRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AirportService {

    private final AirportRepository airportRepository;
    private final FlightRepository flightRepository;

    public AirportService(AirportRepository airportRepository, FlightRepository flightRepository) {
        this.airportRepository = airportRepository;
        this.flightRepository = flightRepository;
    }

    public List<AirportDto> listAll() {
        return airportRepository.findAll()
                .stream()
                .map(this::toDto)
                .toList();
    }

    // ✅ Autocomplete için opsiyonel (query ile)
    public List<AirportDto> search(String q) {
        String query = (q == null) ? "" : q.trim();
        if (query.isEmpty()) {
            // boşsa ilk 50 dönmek yerine hepsini dönmek ağır olabilir.
            // küçük tabloda sorun yok. büyükse findTop.. veya paging yaparız.
            return listAll();
        }
        return airportRepository
                .findTop20ByCodeContainingIgnoreCaseOrCityContainingIgnoreCaseOrNameContainingIgnoreCase(query, query, query)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private AirportDto toDto(Airport a) {
        return new AirportDto(
                a.getId(),
                a.getCity(),
                a.getCode(),
                a.getCountry(),
                a.getName()
        );
    }

    // ✅ From listesi: sadece kalkışı olanlar
    public List<AirportDto> listFromAirports() {
        List<Long> ids = flightRepository.findDistinctDepartureAirportIds();
        return airportRepository.findByIdIn(ids).stream().map(this::toDto).toList();
    }

    // ✅ To listesi: fromId’ye göre gidilebilenler
    public List<AirportDto> listToAirports(Long fromId) {
        List<Long> toIds = flightRepository.findDistinctArrivalAirportIdsByDeparture(fromId);
        return airportRepository.findByIdIn(toIds).stream().map(this::toDto).toList();
    }
}

