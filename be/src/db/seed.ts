import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index.js";
import { categories, products, users, stockTxs, stockTxDetails } from "./schema.js";

const seed = async () => {
  try {
    console.log("Starting seeder for ALL DATA...");

    // 1. Clear existing data (in reverse order of foreign keys)
    console.log("Clearing existing data...");
    await db.delete(stockTxDetails);
    await db.delete(stockTxs);
    await db.delete(products);
    await db.delete(categories);
    await db.delete(users);

    // 2. Seed Users
    console.log("Seeding Users...");
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminId = crypto.randomUUID();
    const staffId = crypto.randomUUID();

    await db.insert(users).values([
      {
        id: adminId,
        name: "System Admin",
        email: "admin@inventory.com",
        password: hashedPassword,
        role: "ADMIN",
      },
      {
        id: staffId,
        name: "Staff Gudang",
        email: "staff@inventory.com",
        password: hashedPassword,
        role: "STAFF",
      },
    ]);

    // 3. Seed Categories
    console.log("Seeding Categories...");
    const categoryNames = ["Elektronik", "Pakaian", "Alat Tulis", "Makanan", "Minuman", "Peralatan Mandi"];
    const catMap = new Map();

    for (const name of categoryNames) {
      const id = crypto.randomUUID();
      await db.insert(categories).values({ id, name });
      catMap.set(name, id);
    }

    // 4. Seed Products
    console.log("Seeding Products...");
    const productsData = [
      { category: "Elektronik", sku: "ELEC-001", name: "Laptop ASUS VivoBook", stock: 10, minStock: 3, buy: "12000000", sell: "15000000" },
      { category: "Elektronik", sku: "ELEC-002", name: "Mouse Wireless Logitech", stock: 50, minStock: 10, buy: "150000", sell: "250000" },
      { category: "Elektronik", sku: "ELEC-003", name: "Keyboard Mechanical", stock: 15, minStock: 5, buy: "450000", sell: "750000" },
      
      { category: "Pakaian", sku: "CLOTH-001", name: "Kaos Polos Hitam XL", stock: 100, minStock: 20, buy: "40000", sell: "85000" },
      { category: "Pakaian", sku: "CLOTH-002", name: "Kemeja Flanel L", stock: 30, minStock: 10, buy: "90000", sell: "175000" },
      
      { category: "Alat Tulis", sku: "STAT-001", name: "Buku Tulis Sinar Dunia", stock: 500, minStock: 50, buy: "3000", sell: "5000" },
      { category: "Alat Tulis", sku: "STAT-002", name: "Pulpen Snowman Black", stock: 300, minStock: 50, buy: "2500", sell: "4000" },
      
      { category: "Makanan", sku: "FOOD-001", name: "Indomie Goreng (Kardus)", stock: 40, minStock: 10, buy: "115000", sell: "135000" },
      { category: "Minuman", sku: "BEV-001", name: "Aqua Botol 600ml (Dus)", stock: 25, minStock: 5, buy: "45000", sell: "60000" },
      { category: "Peralatan Mandi", sku: "BATH-001", name: "Sabun Lifebuoy Total 10", stock: 150, minStock: 25, buy: "3500", sell: "5000" },
    ];

    const prodMap = new Map();
    for (const p of productsData) {
      const id = crypto.randomUUID();
      await db.insert(products).values({
        id,
        categoryId: catMap.get(p.category),
        sku: p.sku,
        name: p.name,
        stock: p.stock,
        minStock: p.minStock,
        buyPrice: p.buy,
        sellPrice: p.sell,
      });
      prodMap.set(p.sku, { id, ...p });
    }

    // 5. Seed Transactions (History over the last 7 days)
    console.log("Seeding Transactions...");
    const today = new Date();
    
    // Helper to generate past dates
    const getPastDate = (daysAgo: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() - daysAgo);
      return d;
    };

    const transactionsToInsert = [
      { daysAgo: 7, type: "IN", code: "TX-IN-001", items: [{ sku: "ELEC-001", qty: 15 }, { sku: "ELEC-002", qty: 60 }] },
      { daysAgo: 6, type: "IN", code: "TX-IN-002", items: [{ sku: "CLOTH-001", qty: 120 }, { sku: "STAT-001", qty: 550 }] },
      { daysAgo: 5, type: "OUT", code: "TX-OUT-001", items: [{ sku: "ELEC-001", qty: 2 }, { sku: "CLOTH-001", qty: 5 }] },
      { daysAgo: 4, type: "OUT", code: "TX-OUT-002", items: [{ sku: "STAT-001", qty: 50 }, { sku: "ELEC-002", qty: 5 }] },
      { daysAgo: 3, type: "IN", code: "TX-IN-003", items: [{ sku: "FOOD-001", qty: 50 }, { sku: "BEV-001", qty: 30 }] },
      { daysAgo: 2, type: "OUT", code: "TX-OUT-003", items: [{ sku: "FOOD-001", qty: 10 }, { sku: "BEV-001", qty: 5 }, { sku: "ELEC-001", qty: 1 }] },
      { daysAgo: 1, type: "ADJUSTMENT", code: "TX-ADJ-001", items: [{ sku: "CLOTH-001", qty: 5 }] }, // Ruined stock
      { daysAgo: 0, type: "OUT", code: "TX-OUT-004", items: [{ sku: "ELEC-001", qty: 2 }, { sku: "ELEC-003", qty: 1 }, { sku: "BATH-001", qty: 10 }] },
    ];

    for (const tx of transactionsToInsert) {
      const txId = crypto.randomUUID();
      await db.insert(stockTxs).values({
        id: txId,
        userId: adminId,
        txCode: tx.code,
        type: tx.type as "IN" | "OUT" | "ADJUSTMENT",
        notes: `Seeder transaction from ${tx.daysAgo} days ago`,
        txDate: getPastDate(tx.daysAgo),
      });

      for (const item of tx.items) {
        const prod = prodMap.get(item.sku);
        if (prod) {
          await db.insert(stockTxDetails).values({
            id: crypto.randomUUID(),
            txId: txId,
            productId: prod.id,
            quantity: item.qty,
            unitPrice: tx.type === "IN" ? prod.buy : prod.sell,
          });
        }
      }
    }

    console.log("Seeder for ALL DATA completed successfully!");
  } catch (error) {
    console.error("Seeder failed", error);
    process.exitCode = 1;
  }
};

void seed();
