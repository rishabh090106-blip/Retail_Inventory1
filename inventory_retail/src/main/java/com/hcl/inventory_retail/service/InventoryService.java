package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.dto.StockOperationRequest;
import com.hcl.inventory_retail.dto.StockTransferRequest;
import com.hcl.inventory_retail.entity.Inventory;
import com.hcl.inventory_retail.entity.Product;
import com.hcl.inventory_retail.entity.Warehouse;
import com.hcl.inventory_retail.exception.InsufficientStockException;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.InventoryRepository;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryService {
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public InventoryService(InventoryRepository inventoryRepository,
                            ProductRepository productRepository,
                            WarehouseRepository warehouseRepository) {
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional
    public Inventory addStock(StockOperationRequest request) {
        Product product = findProduct(request.productId());
        Warehouse warehouse = findWarehouse(request.warehouseId());
        Inventory inventory = inventoryRepository.findForUpdateByProductAndWarehouse(product.getId(), warehouse.getId())
                .orElseGet(() -> new Inventory(null, product, warehouse, 0, null));
        inventory.setQuantity(Math.addExact(inventory.getQuantity(), request.quantity()));
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory reduceStock(StockOperationRequest request) {
        Inventory inventory = lockInventory(request.productId(), request.warehouseId());
        requireAvailable(inventory, request.quantity());
        inventory.setQuantity(inventory.getQuantity() - request.quantity());
        return inventoryRepository.save(inventory);
    }

    @Transactional
    public Inventory transferStock(StockTransferRequest request) {
        if (request.sourceWarehouseId().equals(request.destinationWarehouseId())) {
            throw new IllegalArgumentException("Source and destination warehouses must be different.");
        }
        Inventory source = lockInventory(request.productId(), request.sourceWarehouseId());
        requireAvailable(source, request.quantity());
        source.setQuantity(source.getQuantity() - request.quantity());
        inventoryRepository.save(source);

        Warehouse destinationWarehouse = findWarehouse(request.destinationWarehouseId());
        Inventory destination = inventoryRepository.findForUpdateByProductAndWarehouse(
                        source.getProduct().getId(), destinationWarehouse.getId())
                .orElseGet(() -> new Inventory(null, source.getProduct(), destinationWarehouse, 0, null));
        destination.setQuantity(Math.addExact(destination.getQuantity(), request.quantity()));
        return inventoryRepository.save(destination);
    }

    @Transactional(readOnly = true)
    public List<Inventory> findLowStock() {
        return inventoryRepository.findLowStockItems();
    }

    @Transactional(readOnly = true)
    public List<Inventory> findByWarehouse(Long warehouseId) {
        findWarehouse(warehouseId);
        return inventoryRepository.findByWarehouseId(warehouseId);
    }

    private Inventory lockInventory(Long productId, Long warehouseId) {
        findProduct(productId);
        findWarehouse(warehouseId);
        return inventoryRepository.findForUpdateByProductAndWarehouse(productId, warehouseId)
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", productId + " at warehouse " + warehouseId));
    }

    private void requireAvailable(Inventory inventory, int requestedQuantity) {
        if (inventory.getQuantity() < requestedQuantity) {
            throw new InsufficientStockException("Insufficient stock: available " + inventory.getQuantity()
                    + ", requested " + requestedQuantity + ".");
        }
    }

    private Product findProduct(Long id) {
        return productRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Product", id));
    }

    private Warehouse findWarehouse(Long id) {
        return warehouseRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Warehouse", id));
    }
}