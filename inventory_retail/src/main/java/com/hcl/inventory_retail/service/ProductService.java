package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.SupplierRepository;
import jakarta.validation.Valid;
import org.springframework.stereotype.Service;
import org.springframework.validation.annotation.Validated;

import java.util.List;

@Service
@Validated
public class ProductService {
    private final ProductRepository productRepository;
    private final SupplierRepository supplierRepository;

    public ProductService(ProductRepository productRepository, SupplierRepository supplierRepository) {
        this.productRepository = productRepository;
        this.supplierRepository = supplierRepository;
    }

    public List<Product> findAll() {
        return productRepository.findAll();
    }

    public Product findById(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    public Product findBySku(String sku) {
        return productRepository.findBySku(sku).orElseThrow(() -> new ResourceNotFoundException("Product SKU", sku));
    }

    public List<Product> findByCategory(String category) {
        return productRepository.findByCategory(category);
    }

    public Product create(@Valid Product product) {
        product.setId(null);
        product.setSupplier(findSupplier(product.getSupplier().getId()));
        return productRepository.save(product);
    }

    public Product update(Long id, @Valid Product product) {
        findById(id);
        product.setId(id);
        product.setSupplier(findSupplier(product.getSupplier().getId()));
        return productRepository.save(product);
    }

    public void delete(Long id) {
        productRepository.delete(findById(id));
    }

    private Supplier findSupplier(Long supplierId) {
        return supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", supplierId));
    }
}