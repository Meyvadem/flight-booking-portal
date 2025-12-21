package com.merve.flight_booking.config;

import com.merve.flight_booking.entity.Airline;
import com.merve.flight_booking.entity.Airport;
import com.merve.flight_booking.entity.Flight;
import com.merve.flight_booking.repository.AirlineRepository;
import com.merve.flight_booking.repository.AirportRepository;
import com.merve.flight_booking.repository.FlightRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(
            AirportRepository airportRepo,
            AirlineRepository airlineRepo,
            FlightRepository flightRepo
    ) {
        return args -> {

            // ✅ 1) Eğer DB doluysa seed'i yanlışlıkla 2 kere basmayalım
            // (Sen sıfırladıysan zaten count=0 olur)
            if (flightRepo.count() > 0) {
                System.out.println("[Seeder] Flights already exist. Skipping seed.");
                return;
            }

            // ✅ 2) Airports
            List<Airport> airports = new ArrayList<>();
            airports.add(airport("Istanbul", "SAW", "Turkey", "Sabiha Gökçen Airport"));
            airports.add(airport("Istanbul", "IST", "Turkey", "Istanbul Airport"));
            airports.add(airport("Ankara", "ESB", "Turkey", "Esenboğa Airport"));
            airports.add(airport("Izmir", "ADB", "Turkey", "Adnan Menderes Airport"));
            airports.add(airport("Antalya", "AYT", "Turkey", "Antalya Airport"));
            airports.add(airport("London", "LHR", "United Kingdom", "Heathrow Airport"));
            airports.add(airport("Paris", "CDG", "France", "Charles de Gaulle Airport"));
            airports.add(airport("Barcelona", "BCN", "Spain", "Barcelona El Prat Airport"));
            airports.add(airport("Rome", "FCO", "Italy", "Fiumicino Airport"));
            airports.add(airport("Berlin", "BER", "Germany", "Berlin Brandenburg Airport"));

            airportRepo.saveAll(airports);

            // code -> entity map
            Map<String, Airport> A = new HashMap<>();
            for (Airport ap : airportRepo.findAll()) {
                A.put(ap.getCode(), ap);
            }

            // ✅ 3) Airlines
            List<Airline> airlines = new ArrayList<>();
            airlines.add(airline("PC", "Turkey", "Pegasus Airlines"));
            airlines.add(airline("TK", "Turkey", "Turkish Airlines"));
            airlines.add(airline("XQ", "Turkey", "SunExpress"));
            airlines.add(airline("AJ", "Turkey", "AJet"));
            airlines.add(airline("LH", "Germany", "Lufthansa"));
            airlines.add(airline("QR", "Qatar", "Qatar Airways"));

            airlineRepo.saveAll(airlines);

            Map<String, Airline> L = new HashMap<>();
            for (Airline al : airlineRepo.findAll()) {
                L.put(al.getCode(), al);
            }

            // ✅ 4) Flight routes (gidiş/dönüş mantıklı olsun)
            // İstersen burayı büyütür/küçültürüz.
            List<Route> routes = List.of(
                    r("SAW", "BCN"), r("BCN", "SAW"),
                    r("IST", "LHR"), r("LHR", "IST"),
                    r("IST", "CDG"), r("CDG", "IST"),
                    r("SAW", "FCO"), r("FCO", "SAW"),
                    r("ADB", "BER"), r("BER", "ADB"),
                    r("ESB", "AYT"), r("AYT", "ESB")
            );

            LocalDate start = LocalDate.of(2026, 1, 1);
            LocalDate end = LocalDate.of(2026, 5, 31);

            int flightsPerAirlinePerDay = 6; // 🔧 istersen 4 yap, istersen 8 yap
            Random rnd = new Random(42); // deterministic olsun (test kolay)

            // uçuş saat şablonları
            List<LocalTime> slots = List.of(
                    LocalTime.of(6, 10),
                    LocalTime.of(9, 40),
                    LocalTime.of(12, 20),
                    LocalTime.of(15, 10),
                    LocalTime.of(18, 5),
                    LocalTime.of(21, 30)
            );

            List<Flight> batch = new ArrayList<>();
            int globalCounter = 1;

            for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
                for (Airline airline : L.values()) {

                    for (int i = 0; i < flightsPerAirlinePerDay; i++) {
                        Route rt = routes.get(rnd.nextInt(routes.size()));

                        Airport from = A.get(rt.fromCode());
                        Airport to = A.get(rt.toCode());
                        if (from == null || to == null) continue;
                        if (Objects.equals(from.getId(), to.getId())) continue;

                        LocalTime slot = slots.get(i % slots.size());
                        // küçük random minute kayması
                        int minuteJitter = rnd.nextInt(20); // 0-19 dk
                        LocalDateTime dep = day.atTime(slot).plusMinutes(minuteJitter);

                        // direkt uçuş: 2h - 4h arası
                        int durationMin = 120 + rnd.nextInt(121); // 120..240
                        LocalDateTime arr = dep.plusMinutes(durationMin);

                        double price = 2500 + rnd.nextInt(4500); // 2500..6999

                        Flight f = new Flight();
                        f.setAirline(airline);
                        f.setDepartureAirport(from);
                        f.setArrivalAirport(to);
                        f.setDepartureTime(dep);
                        f.setArrivalTime(arr);
                        f.setBasePrice(price);

                        // flightNumber: PC0001 gibi
                        f.setFlightNumber(airline.getCode() + String.format("%04d", globalCounter++));

                        batch.add(f);

                        // performans için arada flush
                        if (batch.size() >= 1000) {
                            flightRepo.saveAll(batch);
                            batch.clear();
                        }
                    }
                }
            }

            if (!batch.isEmpty()) {
                flightRepo.saveAll(batch);
            }

            System.out.println("[Seeder] Seed completed.");
        };
    }

    private static Airport airport(String city, String code, String country, String name) {
        Airport a = new Airport();
        a.setCity(city);
        a.setCode(code);
        a.setCountry(country);
        a.setName(name);
        return a;
    }

    private static Airline airline(String code, String country, String name) {
        Airline a = new Airline();
        a.setCode(code);
        a.setCountry(country);
        a.setName(name);
        return a;
    }

    private record Route(String fromCode, String toCode) {}
    private static Route r(String from, String to) { return new Route(from, to); }
}
