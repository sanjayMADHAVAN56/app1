package com.outletgadget.controller;

import com.outletgadget.dto.ApiResponse;
import com.outletgadget.dto.ProductDTO;
import com.outletgadget.service.RecommendationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@CrossOrigin(origins = "*")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @Autowired
    public RecommendationController(RecommendationService recommendationService) {
        this.recommendationService = recommendationService;
    }

    // GET /api/recommendations/product/{id} - Similar products recommendation
    @GetMapping("/product/{productId}")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getSimilarProducts(@PathVariable Long productId) {
        List<ProductDTO> recommendations = recommendationService.getSimilarProducts(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Similar products loaded via Gemini AI & Embeddings", recommendations));
    }

    // GET /api/recommendations/personalized - Personal recommendations based on order/cart history
    @GetMapping("/personalized")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getPersonalizedRecommendations(@RequestParam Long userId) {
        List<ProductDTO> recommendations = recommendationService.getPersonalizedRecommendations(userId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Personalized recommendations generated successfully", recommendations));
    }

    // GET /api/recommendations/bundle/{id} - Bundling or Accessory recommendations
    @GetMapping("/bundle/{productId}")
    public ResponseEntity<ApiResponse<List<ProductDTO>>> getProductAccessoriesBundle(@PathVariable Long productId) {
        List<ProductDTO> bundles = recommendationService.getAccessoriesAndBundles(productId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Smart bundles and companion accessories generated", bundles));
    }
}
