package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.WarehouseRepository;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Service
@Validated
public class WarehouseService {
    private final WarehouseRepository warehouseRepository;

    public WarehouseService(WarehouseRepository warehouseRepository) {
        this.warehouseRepository = warehouseRepository;
    }

    public List<Warehouse> findAll() {
        return warehouseRepository.findAll();
    }

    public Warehouse findById(Long id) {
        return warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
    }

    public Warehouse create(@Valid Warehouse warehouse) {
        warehouse.setId(null);
        return warehouseRepository.save(warehouse);
    }

    public Warehouse update(Long id, @Valid Warehouse warehouse) {
        findById(id);
        warehouse.setId(id);
        return warehouseRepository.save(warehouse);
    }

    public void delete(Long id) {
        warehouseRepository.delete(findById(id));
    }
}