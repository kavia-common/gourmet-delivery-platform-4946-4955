# gourmet-delivery-platform-4946-4955

Main Database (MongoDB)

- Port: 5001
- DB Name: myapp
- Admin/App User: appuser
- Password: dbuser123

Quick connect:
- Using saved command: `cat db_connection.txt`
- Or: `mongosh mongodb://appuser:dbuser123@localhost:5001/myapp?authSource=admin`

Seeding
- The startup.sh script will automatically run seed.js after MongoDB is ready and users are created.
- To re-run the seed manually:
  `mongosh mongodb://appuser:dbuser123@localhost:5001/myapp?authSource=admin seed.js`

Collections created by seed:
- users, restaurants, menu_items, orders, deliveries

Indexes created:
- users: email (unique), role
- restaurants: text(name,cuisine), location, ownerId
- menu_items: restaurantId, text(name,tags), price
- orders: userId, restaurantId, status, createdAt(desc)
- deliveries: orderId, courierId, status, updatedAt(desc)

Visualizer
- Environment file: main_database/db_visualizer/mongodb.env
- Ensure it points to port 5001, then:
  - `source main_database/db_visualizer/mongodb.env`
  - `cd main_database/db_visualizer && npm start`

Backup/Restore
- backup_db.sh and restore_db.sh are provided. MongoDB archive will be used if Mongo is detected on port 5001.
