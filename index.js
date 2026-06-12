// Identitas: Zufar Muhammad 24110400001
const express = require('express');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// 1a. GET /wallets
app.get('/wallets', async (req, res) => {
  try {
    const wallets = await prisma.wallet.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(wallets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1b. POST /wallets
app.post('/wallets', async (req, res) => {
  try {
    const { name, currency } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name wajib diisi" });
    }
    const wallet = await prisma.wallet.create({
      data: {
        name,
        currency: currency || "IDR"
      }
    });
    res.status(201).json(wallet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 1c. DELETE /wallets/:id
app.delete('/wallets/:id', async (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet tidak ditemukan" });
    }
    
    // Hapus semua transaksi dari wallet ini terlebih dahulu
    await prisma.transaction.deleteMany({
      where: { walletId }
    });
    
    // Hapus wallet
    await prisma.wallet.delete({
      where: { id: walletId }
    });
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2a. GET /wallets/:id/transactions
app.get('/wallets/:id/transactions', async (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet tidak ditemukan" });
    }
    
    const transactions = await prisma.transaction.findMany({
      where: { walletId },
      orderBy: { date: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2b. POST /wallets/:id/transactions
app.post('/wallets/:id/transactions', async (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const wallet = await prisma.wallet.findUnique({ where: { id: walletId } });
    if (!wallet) {
      return res.status(404).json({ error: "Wallet tidak ditemukan" });
    }
    
    const { amount, type, category, date, note } = req.body;
    
    // Validasi field wajib
    if (amount === undefined || !type || !category || !date) {
      return res.status(400).json({ error: "amount, type, category, dan date wajib diisi" });
    }
    
    // Validasi type
    if (type !== "income" && type !== "expense") {
      return res.status(400).json({ error: 'type harus "income" atau "expense"' });
    }
    
    // Validasi amount
    if (amount <= 0) {
      return res.status(400).json({ error: "amount harus lebih dari 0" });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        amount: parseFloat(amount),
        type,
        category,
        date: new Date(date),
        note: note || null,
        walletId
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2c. DELETE /transactions/:id
app.delete('/transactions/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const transaction = await prisma.transaction.findUnique({ 
      where: { id },
      include: { wallet: true }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: "Transaksi tidak ditemukan" });
    }
    
    await prisma.transaction.delete({ where: { id } });
    
    // Format respons sesuai dengan bonus
    const responseData = {
      deleted: {
        id: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        note: transaction.note,
        date: transaction.date,
        createdAt: transaction.createdAt,
        walletId: transaction.walletId,
        wallet: {
          name: transaction.wallet.name
        }
      }
    };
    
    res.status(200).json(responseData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3a. GET /wallets/:id/balance
app.get('/wallets/:id/balance', async (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const wallet = await prisma.wallet.findUnique({ 
      where: { id: walletId },
      include: { transactions: true }
    });
    
    if (!wallet) {
      return res.status(404).json({ error: "Wallet tidak ditemukan" });
    }
    
    let totalIncome = 0;
    let totalExpense = 0;
    
    wallet.transactions.forEach(t => {
      if (t.type === "income") {
        totalIncome += t.amount;
      } else if (t.type === "expense") {
        totalExpense += t.amount;
      }
    });
    
    const balance = totalIncome - totalExpense;
    
    res.json({
      walletId: wallet.id,
      walletName: wallet.name,
      totalIncome,
      totalExpense,
      balance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3b. GET /wallets/:id/summary
app.get('/wallets/:id/summary', async (req, res) => {
  try {
    const walletId = parseInt(req.params.id);
    const wallet = await prisma.wallet.findUnique({ 
      where: { id: walletId },
      include: { transactions: true }
    });
    
    if (!wallet) {
      return res.status(404).json({ error: "Wallet tidak ditemukan" });
    }
    
    // Group transactions by category using a Map
    const summaryMap = new Map();
    
    wallet.transactions.forEach(t => {
      if (!summaryMap.has(t.category)) {
        summaryMap.set(t.category, {
          category: t.category,
          count: 0,
          totalAmount: 0,
          types: { income: 0, expense: 0 }
        });
      }
      
      const group = summaryMap.get(t.category);
      group.count += 1;
      group.totalAmount += t.amount;
      group.types[t.type] += 1;
    });
    
    // Convert Map to array and calculate average
    const summaryArray = Array.from(summaryMap.values()).map(group => {
      return {
        ...group,
        avgAmount: Number((group.totalAmount / group.count).toFixed(2))
      };
    });
    
    res.json({
      walletId: wallet.id,
      walletName: wallet.name,
      summary: summaryArray
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
