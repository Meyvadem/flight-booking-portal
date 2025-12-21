package com.merve.flight_booking.controller;

import com.merve.flight_booking.entity.User;
import com.merve.flight_booking.repository.BookingRepository;
import com.merve.flight_booking.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDateTime;
import java.util.Optional;

@Controller
@RequestMapping("/admin/users")
public class AdminUserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final BookingRepository bookingRepository;

    public AdminUserController(UserRepository userRepository, PasswordEncoder passwordEncoder, BookingRepository bookingRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.bookingRepository = bookingRepository;
    }

    // ✅ LIST
    @GetMapping
    public String list(Model model,
                       @RequestParam(name = "q", required = false) String q) {

        if (q != null && !q.trim().isEmpty()) {
            String query = q.trim().toLowerCase();
            model.addAttribute("users",
                    userRepository.findAll().stream()
                            .filter(u ->
                                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(query)) ||
                                            (u.getName() != null && u.getName().toLowerCase().contains(query))
                            )
                            .toList()
            );
            model.addAttribute("q", q);
        } else {
            model.addAttribute("users", userRepository.findAll());
            model.addAttribute("q", "");
        }

        return "admin-users"; // templates/admin-users.html
    }

    // ✅ CREATE FORM
    @GetMapping("/new")
    public String newUserForm(Model model) {
        model.addAttribute("name", "");
        model.addAttribute("email", "");
        model.addAttribute("password", "");
        return "admin-user-form"; // templates/admin-user-form.html
    }

    // ✅ CREATE
    @PostMapping
    public String createUser(@RequestParam String name,
                             @RequestParam String email,
                             @RequestParam String password,
                             RedirectAttributes ra,
                             Model model) {

        String nm = name == null ? "" : name.trim();
        String em = email == null ? "" : email.trim().toLowerCase();
        String pw = password == null ? "" : password;

        // Basic validations
        if (nm.length() < 2) {
            model.addAttribute("error", "Name must be at least 2 characters.");
            model.addAttribute("name", nm);
            model.addAttribute("email", em);
            model.addAttribute("password", "");
            return "admin-user-form";
        }
        if (!em.contains("@") || em.length() < 5) {
            model.addAttribute("error", "Email format is invalid.");
            model.addAttribute("name", nm);
            model.addAttribute("email", em);
            model.addAttribute("password", "");
            return "admin-user-form";
        }
        if (pw.length() < 6) {
            model.addAttribute("error", "Password must be at least 6 characters.");
            model.addAttribute("name", nm);
            model.addAttribute("email", em);
            model.addAttribute("password", "");
            return "admin-user-form";
        }

        Optional<User> existing = userRepository.findByEmail(em);
        if (existing.isPresent()) {
            model.addAttribute("error", "This email is already registered.");
            model.addAttribute("name", nm);
            model.addAttribute("email", em);
            model.addAttribute("password", "");
            return "admin-user-form";
        }

        User u = new User();
        u.setName(nm);
        u.setEmail(em);
        u.setPassword(passwordEncoder.encode(pw));

        // ✅ rol default USER (senin enum ismin: Role.USER gibi)
        u.setRole(com.merve.flight_booking.entity.Role.USER);

        userRepository.save(u);

        ra.addFlashAttribute("msg", "User created successfully.");
        return "redirect:/admin/users";
    }

    // ✅ DELETE
    @PostMapping("/{id}/delete")
    public String deleteUser(@PathVariable Long id, RedirectAttributes ra) {
        if (id == null) return "redirect:/admin/users";

        if (!userRepository.existsById(id)) {
            ra.addFlashAttribute("msg", "User not found.");
            return "redirect:/admin/users";
        }

        if (bookingRepository.existsByUser_Id(id)) {
            ra.addFlashAttribute("msg", "Cannot delete user: user has bookings. Cancel/delete bookings first.");
            return "redirect:/admin/users";
        }

        userRepository.deleteById(id);
        ra.addFlashAttribute("msg", "User deleted.");
        return "redirect:/admin/users";
    }

}
