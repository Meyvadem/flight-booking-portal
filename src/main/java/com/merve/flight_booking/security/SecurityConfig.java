package com.merve.flight_booking.security;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    // 1) Admin için DB'den bağımsız in-memory kullanıcı
    @Bean("adminUsers")
    public UserDetailsService adminUsers(PasswordEncoder encoder) {
        return new InMemoryUserDetailsManager(
                User.withUsername("admin")
                        .password(encoder.encode("Admin@2025!FlyAway"))
                        .roles("ADMIN")
                        .build()
        );
    }

    // 2) /admin/** -> session + form login (JWT yok)
    @Bean
    @Order(1)
    public SecurityFilterChain adminChain(
            HttpSecurity http,
            @Qualifier("adminUsers") UserDetailsService adminUsers
    ) throws Exception {

        return http
                .securityMatcher("/admin/**")
                .csrf(csrf -> csrf.disable())
                .userDetailsService(adminUsers)
                .anonymous(a -> a.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/admin/login").permitAll()
                        .anyRequest().hasRole("ADMIN")
                )
                .formLogin(form -> form
                        .loginPage("/admin/login")
                        .loginProcessingUrl("/admin/login")
                        .defaultSuccessUrl("/admin", true)
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/admin/logout")
                        .logoutSuccessUrl("/admin/login?logout")
                )
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .build();
    }

    // 3) /api/** -> stateless + JWT (BURASI JWT, DEĞİŞTİRMİYORUZ)
    @Bean
    @Order(2)
    public SecurityFilterChain apiChain(HttpSecurity http) throws Exception {
        return http
                .securityMatcher("/api/**") // ✅ KRİTİK: sadece /api
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.GET,
                                "/api/baggage-options",
                                "/api/meal-options",
                                "/api/seat-options"
                        ).permitAll()
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/flights/**",
                                "/api/airports/**",
                                "/error"
                        ).permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    // 4) SPA / React routes (/, /results, /ancillaries, /payment ...) -> permitAll
    @Bean
    @Order(3)
    public SecurityFilterChain spaChain(HttpSecurity http) throws Exception {
        return http
                // admin ve api dışındaki her şey buraya düşer
                .csrf(csrf -> csrf.disable())
                .anonymous(a -> a.disable())
                .authorizeHttpRequests(auth -> auth
                        .anyRequest().permitAll()
                )
                .build();
    }
}
