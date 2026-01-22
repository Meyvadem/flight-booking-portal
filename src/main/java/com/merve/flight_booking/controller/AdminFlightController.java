
package com.merve.flight_booking.controller;

import com.merve.flight_booking.entity.Airline;
import com.merve.flight_booking.entity.Airport;
import com.merve.flight_booking.entity.Flight;
import com.merve.flight_booking.repository.AirlineRepository;
import com.merve.flight_booking.repository.AirportRepository;
import com.merve.flight_booking.repository.BookingRepository;
import com.merve.flight_booking.repository.FlightRepository;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
        import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import java.util.Optional;

@Controller
@RequestMapping("/admin/flights")
public class AdminFlightController {

    private final FlightRepository flightRepository;
    private final AirlineRepository airlineRepository;
    private final AirportRepository airportRepository;
    private final BookingRepository bookingRepository;

    private static final DateTimeFormatter DT_LOCAL =
            DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm");

    public AdminFlightController(
            FlightRepository flightRepository,
            AirlineRepository airlineRepository,
            AirportRepository airportRepository,
            BookingRepository bookingRepository
    ) {
        this.flightRepository = flightRepository;
        this.airlineRepository = airlineRepository;
        this.airportRepository = airportRepository;
        this.bookingRepository = bookingRepository;
    }


    @GetMapping
    public String list(Model model, @RequestParam(name = "q", required = false) String q) {
        var all = flightRepository.findAll();

        if (q != null && !q.trim().isEmpty()) {
            String query = q.trim().toLowerCase(Locale.ROOT);
            all = all.stream().filter(f ->
                    contains(f.getFlightNumber(), query) ||
                            contains(f.getAirline() != null ? f.getAirline().getCode() : null, query) ||
                            contains(f.getAirline() != null ? f.getAirline().getName() : null, query) ||
                            contains(f.getDepartureAirport() != null ? f.getDepartureAirport().getCode() : null, query) ||
                            contains(f.getDepartureAirport() != null ? f.getDepartureAirport().getCity() : null, query) ||
                            contains(f.getArrivalAirport() != null ? f.getArrivalAirport().getCode() : null, query) ||
                            contains(f.getArrivalAirport() != null ? f.getArrivalAirport().getCity() : null, query)
            ).toList();
            model.addAttribute("q", q);
        } else {
            model.addAttribute("q", "");
        }

        model.addAttribute("flights", all);
        return "admin-flights"; // templates/admin-flights.html
    }

    private boolean contains(String s, String q) {
        return s != null && s.toLowerCase(Locale.ROOT).contains(q);
    }


    @GetMapping("/new")
    public String newForm(Model model) {
        model.addAttribute("flightNumber", "");
        model.addAttribute("airlineId", "");
        model.addAttribute("departureAirportId", "");
        model.addAttribute("arrivalAirportId", "");
        model.addAttribute("departureTime", "");
        model.addAttribute("arrivalTime", "");
        model.addAttribute("basePrice", "");

        model.addAttribute("airlines", airlineRepository.findAll());
        model.addAttribute("airports", airportRepository.findAll());
        return "admin-flight-form"; // templates/admin-flight-form.html
    }


    @PostMapping
    public String create(
            @RequestParam String flightNumber,
            @RequestParam Long airlineId,
            @RequestParam Long departureAirportId,
            @RequestParam Long arrivalAirportId,
            @RequestParam String departureTime,
            @RequestParam String arrivalTime,
            @RequestParam Double basePrice,
            Model model,
            RedirectAttributes ra
    ) {
        // repopulate lists if error
        model.addAttribute("airlines", airlineRepository.findAll());
        model.addAttribute("airports", airportRepository.findAll());

        String fn = flightNumber == null ? "" : flightNumber.trim().toUpperCase(Locale.ROOT);

        // validations
        if (fn.length() < 3) return formError(model, "Flight number is required.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);
        if (flightRepository.existsByFlightNumber(fn)) return formError(model, "Flight number already exists.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);

        if (basePrice == null || basePrice <= 0) return formError(model, "Base price must be greater than 0.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);
        if (departureAirportId.equals(arrivalAirportId)) return formError(model, "Departure and arrival airports must be different.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);

        LocalDateTime dep;
        LocalDateTime arr;
        try {
            dep = LocalDateTime.parse(departureTime, DT_LOCAL);
            arr = LocalDateTime.parse(arrivalTime, DT_LOCAL);
        } catch (Exception e) {
            return formError(model, "Date/time format is invalid.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);
        }

        if (!arr.isAfter(dep)) {
            return formError(model, "Arrival time must be after departure time.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);
        }

        Optional<Airline> airline = airlineRepository.findById(airlineId);
        Optional<Airport> depAp = airportRepository.findById(departureAirportId);
        Optional<Airport> arrAp = airportRepository.findById(arrivalAirportId);

        if (airline.isEmpty() || depAp.isEmpty() || arrAp.isEmpty()) {
            return formError(model, "Selected airline/airport not found.", fn, airlineId, departureAirportId, arrivalAirportId, departureTime, arrivalTime, basePrice);
        }

        Flight f = new Flight();
        f.setFlightNumber(fn);
        f.setAirline(airline.get());
        f.setDepartureAirport(depAp.get());
        f.setArrivalAirport(arrAp.get());
        f.setDepartureTime(dep);
        f.setArrivalTime(arr);
        f.setBasePrice(basePrice);

        flightRepository.save(f);

        ra.addFlashAttribute("msg", "Flight created successfully.");
        return "redirect:/admin/flights";
    }

    private String formError(
            Model model,
            String error,
            String flightNumber,
            Long airlineId,
            Long departureAirportId,
            Long arrivalAirportId,
            String departureTime,
            String arrivalTime,
            Double basePrice
    ) {
        model.addAttribute("error", error);
        model.addAttribute("flightNumber", flightNumber);
        model.addAttribute("airlineId", airlineId);
        model.addAttribute("departureAirportId", departureAirportId);
        model.addAttribute("arrivalAirportId", arrivalAirportId);
        model.addAttribute("departureTime", departureTime);
        model.addAttribute("arrivalTime", arrivalTime);
        model.addAttribute("basePrice", basePrice == null ? "" : String.valueOf(basePrice));
        return "admin-flight-form";
    }


    @PostMapping("/{id}/delete")
    public String delete(@PathVariable Long id, RedirectAttributes ra) {
        if (id == null) return "redirect:/admin/flights";

        if (!flightRepository.existsById(id)) {
            ra.addFlashAttribute("msg", "Flight not found.");
            return "redirect:/admin/flights";
        }

        if (bookingRepository.existsByFlight_Id(id)) {
            ra.addFlashAttribute("msg", "Cannot delete: there are bookings for this flight.");
            return "redirect:/admin/flights";
        }

        flightRepository.deleteById(id);
        ra.addFlashAttribute("msg", "Flight deleted.");
        return "redirect:/admin/flights";
    }
}
