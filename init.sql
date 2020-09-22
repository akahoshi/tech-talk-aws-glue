CREATE TABLE Orders (
    id int NOT NULL AUTO_INCREMENT,
    comment VARCHAR(255),
    PRIMARY KEY (id)
);
CREATE TABLE Items (
    id int NOT NULL AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    description VARCHAR(255),
    price DECIMAL(5, 2) NOT NULL,
    PRIMARY KEY (id)
);
CREATE TABLE OrderItems (
    order_id int NOT NULL,
    item_id int NOT NULL,
    CONSTRAINT PK_OrderItem PRIMARY KEY (order_id, item_id),
    CONSTRAINT FK_OrderItem_Order FOREIGN KEY (order_id) REFERENCES Orders(id),
    CONSTRAINT FK_OrderItem_Item FOREIGN KEY (item_id) REFERENCES Items(id)
);