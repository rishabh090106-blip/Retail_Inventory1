package com.hcl.inventory_retail.controller;

import com.hcl.inventory_retail.dto.StockOperationRequest;
import com.hcl.inventory_retail.dto.StockTransferRequest;
import com.hcl.inventory_retail.entity.Inventory;
import com.hcl.inventory_retail.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {
    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @PostMapping("/add")
    public ResponseEntity<Inventory> addStock(@Valid @RequestBody StockOperationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(inventoryService.addStock(request));
    }

    @PostMapping("/reduce")
    public Inventory reduceStock(@Valid @RequestBody StockOperationRequest request) {
        return inventoryService.reduceStock(request);
    }

    @PostMapping("/transfer")
    public Inventory transferStock(@Valid @RequestBody StockTransferRequest request) {
        return inventoryService.transferStock(request);
    }

    @GetMapping("/low-stock")
    public List<Inventory> findLowStock() {
        return inventoryService.findLowStock();
    }

    @GetMapping("/warehouse/{warehouseId}")
    public List<Inventory> findByWarehouse(@PathVariable Long warehouseId) {
        return inventoryService.findByWarehouse(warehouseId);
    }
}