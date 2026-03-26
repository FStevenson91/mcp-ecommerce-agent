CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  garment_type TEXT NOT NULL,
  size TEXT,
  color TEXT,
  stock INTEGER NOT NULL,
  price_50 INTEGER NOT NULL,
  price_100 INTEGER NOT NULL,
  price_200 INTEGER NOT NULL,
  available BOOLEAN,
  category TEXT,
  description TEXT
);

CREATE TABLE carts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE cart_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cart_id INTEGER NOT NULL REFERENCES carts(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL
);