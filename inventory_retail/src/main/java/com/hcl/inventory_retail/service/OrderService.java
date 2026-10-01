package com.hcl.inventory_retail.service;

import com.hcl.inventory_retail.dto.PlaceOrderRequest;
import com.hcl.inventory_retail.entity.CustomerOrder;
import com.hcl.inventory_retail.entity.Inventory;
import com.hcl.inventory_retail.entity.OrderStatus;
import com.hcl.inventory_retail.exception.InsufficientStockException;
import com.hcl.inventory_retail.exception.ResourceNotFoundException;
import com.hcl.inventory_retail.repository.CustomerOrderRepository;
import com.hcl.inventory_retail.repository.InventoryRepository;
import com.hcl.inventory_retail.repository.ProductRepository;
import com.hcl.inventory_retail.repository.WarehouseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class OrderService {
    private final CustomerOrderRepository orderRepository;
    private final InventoryRepository inventoryRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public OrderService(CustomerOrderRepository orderRepository,
                        InventoryRepository inventoryRepository,
                        ProductRepository productRepository,
                        WarehouseRepository warehouseRepository) {
        this.orderRepository = orderRepository;
        this.inventoryRepository = inventoryRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Transactional
    public CustomerOrder placeOrder(PlaceOrderRequest request) {
        var product = productRepository.findById(request.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", request.productId()));
        var warehouse = warehouseRepository.findById(request.warehouseId())
                .orElseThrow(() -> new ResourceNotFoundException("Warehouse", request.warehouseId()));
        Inventory inventory = inventoryRepository.findForUpdateByProductAndWarehouse(product.getId(), warehouse.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Inventory", product.getId() + " at warehouse " + warehouse.getId()));
        if (inventory.getQuantity() < request.quantity()) {
            throw new InsufficientStockException("Insufficient stock: available " + inventory.getQuantity()
                    + ", requested " + request.quantity() + ".");
        }

        inventory.setQuantity(inventory.getQuantity() - request.quantity());
        inventoryRepository.save(inventory);

        CustomerOrder order = new CustomerOrder();
        order.setOrderNumber("ORD-" + UUID.randomUUID().toString().toUpperCase());
        order.setCustomerName(request.customerName());
        order.setProduct(product);
        order.setWarehouse(warehouse);
        order.setQuantity(request.quantity());
        order.setStatus(OrderStatus.CONFIRMED);
        return orderRepository.save(order);
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> findAll() {
        return orderRepository.findAll();
    }

    @Transactional(readOnly = true)
    public CustomerOrder findById(Long id) {
        return orderRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Order", id));
    }

    @Transactional(readOnly = true)
    public List<CustomerOrder> findByStatus(OrderStatus status) {
        return orderRepository.findByStatus(status);
    }

    @Transactional
    public CustomerOrder updateStatus(Long id, OrderStatus status) {
        if (status == OrderStatus.CANCELLED) {
            return cancel(id);
        }
        CustomerOrder order = findById(id);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new IllegalArgumentException("A cancelled order cannot be changed.");
        }
        order.setStatus(status);
        return orderRepository.save(order);
    }

    @Transactional
    public CustomerOrder cancel(Long id) {
        CustomerOrder order = orderRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Order", id));
        if (order.getStatus() == OrderStatus.CANCELLED) {
            return order;
        }
        if (order.getStatus() == OrderStatus.SHIPPED || order.getStatus() == OrderStatus.DELIVERED) {
            throw new IllegalArgumentException("Shipped or delivered orders cannot be cancelled.");
        }

        Inventory inventory = inventoryRepository.findForUpdateByProductAndWarehouse(
                        order.getProduct().getId(), order.getWarehouse().getId())
                .orElseGet(() -> new Inventory(null, order.getProduct(), order.getWarehouse(), 0, null));
        inventory.setQuantity(Math.addExact(inventory.getQuantity(), order.getQuantity()));
        inventoryRepository.save(inventory);
        order.setStatus(OrderStatus.CANCELLED);
        return orderRepository.save(order);
    }
}