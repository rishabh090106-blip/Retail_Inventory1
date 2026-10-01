package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.SupplierRepository;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Service
@Validated
public class SupplierService {
    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<Supplier> findAll() {
        return supplierRepository.findAll();
    }

    public Supplier findById(Long id) {
        return supplierRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Supplier", id));
    }

    public Supplier create(@Valid Supplier supplier) {
        supplier.setId(null);
        return supplierRepository.save(supplier);
    }

    public Supplier update(Long id, @Valid Supplier supplier) {
        findById(id);
        supplier.setId(id);
        return supplierRepository.save(supplier);
    }

    public void delete(Long id) {
        supplierRepository.delete(findById(id));
    }
}