package com.hcl.inventory_retail.controller;

import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.service.WarehouseService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/warehouses")
public class WarehouseController {
    private final WarehouseService warehouseService;

    public WarehouseController(WarehouseService warehouseService) {
        this.warehouseService = warehouseService;
    }

    @GetMapping
    public List<Warehouse> findAll() {
        return warehouseService.findAll();
    }

    @GetMapping("/{id}")
    public Warehouse findById(@PathVariable Long id) {
        return warehouseService.findById(id);
    }

    @PostMapping
    public ResponseEntity<Warehouse> create(@Valid @RequestBody Warehouse warehouse) {
        return ResponseEntity.status(HttpStatus.CREATED).body(warehouseService.create(warehouse));
    }

    @PutMapping("/{id}")
    public Warehouse update(@PathVariable Long id, @Valid @RequestBody Warehouse warehouse) {
        return warehouseService.update(id, warehouse);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        warehouseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}