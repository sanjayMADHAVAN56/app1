package com.outletgadget.controller;

import com.outletgadget.dto.ApiResponse;
import com.outletgadget.dto.LoginRequest;
import com.outletgadget.dto.RegisterRequest;
import com.outletgadget.service.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @Autowired
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<String>> login(@RequestBody LoginRequest loginRequest) {
        String token = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(new ApiResponse<>(true, "Login successful", token));
    }

    // POST /api/auth/register
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(@RequestBody RegisterRequest registerRequest) {
        authService.registerUser(registerRequest);
        return ResponseEntity.ok(new ApiResponse<>(true, "User registered successfully! Check your email for OTP verification.", null));
    }

    // POST /api/auth/forgot-password
    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<Void>> forgotPassword(@RequestParam String email) {
        authService.sendPasswordResetCode(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Simulated reset OTP code sent to " + email, null));
    }

    // POST /api/auth/verify-otp
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<Void>> verifyOtp(@RequestParam String email, @RequestParam String otp) {
        authService.verifyOtpCode(email, otp);
        return ResponseEntity.ok(new ApiResponse<>(true, "OTP verification successful", null));
    }
}
