package com.hcl.inventory_retail.config;

import com.hcl.inventory_retail.entity.Inventory;
import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.Supplier;
import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.repository.InventoryRepository;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.SupplierRepository;
import com.hcl.inventory_retail.repository.WarehouseRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seedInventoryData(SupplierRepository supplierRepository,
                                        ProductRepository productRepository,
                                        WarehouseRepository warehouseRepository,
                                        InventoryRepository inventoryRepository) {
        return args -> {
            if (supplierRepository.count() > 0 || productRepository.count() > 0
                    || warehouseRepository.count() > 0 || inventoryRepository.count() > 0) {
                return;
            }

            Supplier supplier = supplierRepository.save(new Supplier(null, "Northstar Wholesale", "Morgan Lee",
                    "sales@northstar.example", "+1-555-0100", "100 Market Street"));
            Product coffee = productRepository.save(new Product(null, "Ground Coffee", "COF-001",
                    "Medium roast ground coffee, 12 oz.", "Grocery", new BigDecimal("12.99"), 10, supplier));
            Product tea = productRepository.save(new Product(null, "Green Tea", "TEA-001",
                    "Loose leaf green tea, 100 g.", "Grocery", new BigDecimal("8.49"), 8, supplier));
            Warehouse warehouse = warehouseRepository.save(new Warehouse(null, "Central Warehouse", "Chicago", 5000));
            inventoryRepository.save(new Inventory(null, coffee, warehouse, 120, null));
            inventoryRepository.save(new Inventory(null, tea, warehouse, 75, null));
        };
    }
}