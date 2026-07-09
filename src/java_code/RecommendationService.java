package com.outletgadget.service;

import com.outletgadget.dto.ProductDTO;
import com.google.gson.Gson;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class RecommendationService {

    @Value("${gemini.api.key}")
    private String geminiApiKey;

    private final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
    private final RestTemplate restTemplate = new RestTemplate();
    private final Gson gson = new Gson();

    /**
     * Gets similar products by using Gemini AI or sentence-embeddings.
     */
    public List<ProductDTO> getSimilarProducts(Long productId) {
        // In a real application, we would retrieve product details from database,
        // send them to the Gemini API with a strict JSON format prompt,
        // and fetch similar item IDs.
        // Here we show the Spring implementation pattern of contacting Gemini:
        try {
            String prompt = "Find similar products for Product ID " + productId + " based on category, specifications and brand. Return response in JSON format of product IDs.";
            String response = queryGemini(prompt);
            // Parse and return matching products from the DB.
        } catch (Exception e) {
            // Log error, fallback to category search
        }
        return new ArrayList<>(); // Fallback / mock database resolution
    }

    /**
     * Identifies bundles/accessories for a refurbished product.
     */
    public List<ProductDTO> getAccessoriesAndBundles(Long productId) {
        // AI logic to pair a smartphone with refurbished charger, laptop with sleeves, etc.
        return new ArrayList<>();
    }

    /**
     * Identifies personalized recommendations for a customer.
     */
    public List<ProductDTO> getPersonalizedRecommendations(Long userId) {
        // Query user order history, generate profile prompt, and pass to Gemini
        return new ArrayList<>();
    }

    private String queryGemini(String prompt) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        Map<String, Object> part = new HashMap<>();
        part.put("text", prompt);
        
        Map<String, Object> content = new HashMap<>();
        content.put("parts", List.of(part));
        
        Map<String, Object> body = new HashMap<>();
        body.put("contents", List.of(content));

        HttpEntity<String> entity = new HttpEntity<>(gson.toJson(body), headers);
        
        String urlWithKey = GEMINI_API_URL + "?key=" + geminiApiKey;
        return restTemplate.postForObject(urlWithKey, entity, String.class);
    }
}
