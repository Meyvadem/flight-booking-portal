package com.merve.flight_booking.controller;

import com.merve.flight_booking.dto.*;
import com.merve.flight_booking.entity.Role;
import com.merve.flight_booking.entity.User;
import com.merve.flight_booking.repository.UserRepository;
import com.merve.flight_booking.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserRepository userRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {

        if (userRepository.existsByEmail(req.getEmail().toLowerCase())) {
            return ResponseEntity.badRequest().body("Email already exists");
        }

        User u = new User();
        u.setName(req.getName());
        u.setEmail(req.getEmail().toLowerCase());
        u.setPassword(passwordEncoder.encode(req.getPassword()));
        u.setRole(Role.USER);

        userRepository.save(u);

        String token = jwtService.generateToken(u);
        return ResponseEntity.ok(new AuthResponse(token, u.getRole().name()));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {

        User u = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElse(null);

        if (u == null || !passwordEncoder.matches(req.getPassword(), u.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }

        String token = jwtService.generateToken(u);
        return ResponseEntity.ok(new AuthResponse(token, u.getRole().name()));
    }
}
