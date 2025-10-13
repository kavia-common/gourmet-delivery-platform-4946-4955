(function () {
  // PUBLIC_INTERFACE
  /**
   * Seed script for initial data and indexes.
   * - Creates collections: users, restaurants, menu_items, orders, deliveries
   * - Adds useful indexes for lookups and search
   * - Inserts demo data for a working end-to-end flow
   * This file is executed via mongosh.
   */

  const dbName = db.getName();

  function log(msg) {
    print(`[seed] ${msg}`);
  }

  function ensureCollection(name) {
    if (!db.getCollectionNames().includes(name)) {
      db.createCollection(name);
      log(`Created collection: ${name}`);
    } else {
      log(`Collection exists: ${name}`);
    }
    return db.getCollection(name);
  }

  function upsertOneByKey(col, key, doc) {
    const filter = {};
    filter[key] = doc[key];
    return col.updateOne(filter, { $setOnInsert: doc }, { upsert: true });
  }

  function createIndexes() {
    // Users
    db.users.createIndex({ email: 1 }, { unique: true, name: "idx_users_email_unique" });
    db.users.createIndex({ role: 1 }, { name: "idx_users_role" });

    // Restaurants
    db.restaurants.createIndex({ name: "text", cuisine: "text" }, { name: "idx_restaurants_text" });
    db.restaurants.createIndex({ location: 1 }, { name: "idx_restaurants_location" });
    db.restaurants.createIndex({ ownerId: 1 }, { name: "idx_restaurants_ownerId" });

    // Menu Items
    db.menu_items.createIndex({ restaurantId: 1 }, { name: "idx_menu_items_restaurantId" });
    db.menu_items.createIndex({ name: "text", tags: "text" }, { name: "idx_menu_items_text" });
    db.menu_items.createIndex({ price: 1 }, { name: "idx_menu_items_price" });

    // Orders
    db.orders.createIndex({ userId: 1 }, { name: "idx_orders_userId" });
    db.orders.createIndex({ restaurantId: 1 }, { name: "idx_orders_restaurantId" });
    db.orders.createIndex({ status: 1 }, { name: "idx_orders_status" });
    db.orders.createIndex({ createdAt: -1 }, { name: "idx_orders_createdAt" });

    // Deliveries
    db.deliveries.createIndex({ orderId: 1 }, { name: "idx_deliveries_orderId" });
    db.deliveries.createIndex({ courierId: 1 }, { name: "idx_deliveries_courierId" });
    db.deliveries.createIndex({ status: 1 }, { name: "idx_deliveries_status" });
    db.deliveries.createIndex({ updatedAt: -1 }, { name: "idx_deliveries_updatedAt" });
  }

  log(`Seeding database '${dbName}' ...`);

  const users = ensureCollection("users");
  const restaurants = ensureCollection("restaurants");
  const menuItems = ensureCollection("menu_items");
  const orders = ensureCollection("orders");
  const deliveries = ensureCollection("deliveries");

  // Sample users
  const uAlice = {
    _id: ObjectId(),
    name: "Alice Johnson",
    email: "alice@example.com",
    role: "customer",
    createdAt: new Date(),
  };
  const uBob = {
    _id: ObjectId(),
    name: "Bob Smith",
    email: "bob@example.com",
    role: "courier",
    createdAt: new Date(),
  };
  const uOwner = {
    _id: ObjectId(),
    name: "Resto Owner",
    email: "owner@example.com",
    role: "owner",
    createdAt: new Date(),
  };

  upsertOneByKey(users, "email", uAlice);
  upsertOneByKey(users, "email", uBob);
  upsertOneByKey(users, "email", uOwner);

  // Sample restaurant
  const rOcean = {
    _id: ObjectId(),
    name: "Ocean Breeze Grill",
    cuisine: "Seafood",
    location: "Downtown",
    ownerId: uOwner._id,
    rating: 4.6,
    createdAt: new Date(),
  };
  upsertOneByKey(restaurants, "name", rOcean);

  // Sample menu items
  const mi1 = {
    _id: ObjectId(),
    restaurantId: rOcean._id,
    name: "Grilled Salmon",
    description: "Fresh Atlantic salmon with lemon butter sauce",
    price: 18.99,
    tags: ["seafood", "grill", "gluten-free"],
    available: true,
    createdAt: new Date(),
  };
  const mi2 = {
    _id: ObjectId(),
    restaurantId: rOcean._id,
    name: "Fish Tacos",
    description: "Crispy cod with slaw and chipotle mayo",
    price: 12.5,
    tags: ["seafood", "spicy"],
    available: true,
    createdAt: new Date(),
  };
  const mi3 = {
    _id: ObjectId(),
    restaurantId: rOcean._id,
    name: "Clam Chowder",
    description: "Creamy New England style chowder",
    price: 7.99,
    tags: ["soup"],
    available: true,
    createdAt: new Date(),
  };

  // Upsert menu items by restaurantId+name
  function upsertMenuItem(doc) {
    menuItems.updateOne(
      { restaurantId: doc.restaurantId, name: doc.name },
      { $setOnInsert: doc },
      { upsert: true }
    );
  }
  upsertMenuItem(mi1);
  upsertMenuItem(mi2);
  upsertMenuItem(mi3);

  // Demo order with status history
  const now = new Date();
  const order1 = {
    _id: ObjectId(),
    userId: uAlice._id,
    restaurantId: rOcean._id,
    items: [
      { menuItemId: mi1._id, name: mi1.name, qty: 1, price: mi1.price },
      { menuItemId: mi2._id, name: mi2.name, qty: 2, price: mi2.price },
    ],
    subtotal: mi1.price * 1 + mi2.price * 2,
    deliveryFee: 3.99,
    tax: 2.76,
    total: Math.round((mi1.price * 1 + mi2.price * 2 + 3.99 + 2.76) * 100) / 100,
    status: "preparing",
    statusHistory: [
      { status: "placed", at: new Date(now.getTime() - 15 * 60 * 1000) },
      { status: "accepted", at: new Date(now.getTime() - 13 * 60 * 1000) },
      { status: "preparing", at: new Date(now.getTime() - 8 * 60 * 1000) },
    ],
    createdAt: new Date(now.getTime() - 15 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 8 * 60 * 1000),
    deliveryAddress: {
      line1: "101 Ocean Ave",
      city: "Seaside",
      zip: "90210",
    },
    payment: {
      method: "card",
      last4: "4242",
      status: "authorized",
    },
  };

  // Upsert order by _id or composite unique (userId + createdAt)
  orders.updateOne(
    { userId: order1.userId, createdAt: order1.createdAt },
    { $setOnInsert: order1 },
    { upsert: true }
  );

  // Demo delivery
  const delivery1 = {
    _id: ObjectId(),
    orderId: order1._id,
    courierId: uBob._id,
    status: "assigned",
    tracking: [
      { status: "assigned", at: new Date(now.getTime() - 7 * 60 * 1000) },
      { status: "picked_up", at: new Date(now.getTime() - 3 * 60 * 1000) },
    ],
    etaMinutes: 10,
    createdAt: new Date(now.getTime() - 7 * 60 * 1000),
    updatedAt: new Date(now.getTime() - 3 * 60 * 1000),
  };

  deliveries.updateOne(
    { orderId: delivery1.orderId },
    { $setOnInsert: delivery1 },
    { upsert: true }
  );

  // Indexes after data ensure
  createIndexes();

  log("Seed complete.");
})();
