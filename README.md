# UTS Web Advanced Development - Personal Finance API
**Oleh: Zufar Muhammad (24110400001)**

Proyek ini adalah implementasi REST API untuk manajemen keuangan pribadi (*Personal Finance API*) yang dibuat menggunakan **Node.js, Express.js**, dan **Prisma ORM** (dengan database SQLite).

---

## 1. Cara Menjalankan Proyek (Setup & Run)

Jika kode ini baru di-clone dari GitHub atau ingin dijalankan di komputer dosen, ikuti langkah berikut:

1. **Install Dependencies:**
   Jalankan perintah ini di terminal untuk mengunduh semua *library* (Express, Prisma, dll) ke dalam folder `node_modules`.
   ```bash
   npm install
   ```

2. **Inisialisasi Database SQLite:**
   Sinkronkan skema Prisma dengan database lokal.
   ```bash
   npx prisma db push
   ```

3. **Seeding Data (Masukkan Data Awal):**
   Jalankan perintah ini untuk mengisi database `dev.db` dengan data awal ("BCA Tabungan", "Cash", dan beberapa transaksi) sesuai instruksi soal.
   ```bash
   npm run seed
   ```

4. **Jalankan Server:**
   ```bash
   node index.js
   ```
   Server akan menyala dan siap menerima *request* di `http://localhost:3000`.

---

## 2. Penjelasan Struktur File

- `index.js`: Berisi logika utama aplikasi (Server Express dan semua *endpoint* HTTP).
- `prisma/schema.prisma`: Berisi skema database untuk tabel `Wallet` dan `Transaction` sesuai instruksi UTS.
- `prisma/seed.js`: Script otomatis untuk memasukkan data awal ke dalam tabel ketika `npm run seed` dijalankan.
- `dev.db`: Adalah file fisik dari database SQLite yang menyimpan data kita (dibuat otomatis oleh Prisma, sengaja tidak di-push ke GitHub).

---

## 3. Penjelasan Logika UTS (Buat Jaga-jaga)

ini poin-poin utamanya:

### A. Konsep Relasi (Foreign Key)
Dalam proyek ini, 1 `Wallet` bisa memiliki banyak `Transaction` (*One-to-Many*). 
- Di tabel `Transaction`, ada kolom `walletId` yang merujuk ke tabel `Wallet`.
- Pada saat fitur **DELETE Wallet** (Soal 1c) dipanggil, kita wajib melakukan kode ini terlebih dahulu: `await prisma.transaction.deleteMany({ where: { walletId } })`. Mengapa? Karena kalau Wallet-nya dihapus duluan sementara transaksinya masih ada, database akan memunculkan *error Foreign Key Constraint*.

### B. Soal Bonus (2c) - DELETE Transaction & Return Data
Saat menghapus transaksi, soal bonus meminta kita mengembalikan format JSON transaksi yang baru saja dihapus beserta nama dompetnya. 
- Kita gunakan `prisma.transaction.findUnique({ include: { wallet: true } })` untuk mengambil data transaksi sekaligus men-_join_ data walletnya, agar nama wallet ("BCA Tabungan") bisa dipanggil dengan `transaction.wallet.name`.

### C. Soal 3a & 3b (Derived Data / Data Turunan)
Kedua soal ini adalah inti logika dari UTS, karena datanya tidak murni dari database, melainkan diproses dulu di JavaScript.

**Soal 3a (Balance):**
- Diambil semua transaksi milik suatu dompet.
- Di-looping dengan `forEach`. Jika tipenya "income", ditambahkan ke variabel `totalIncome`. Jika "expense", ditambahkan ke `totalExpense`.
- `balance` didapatkan dari hitungan: `totalIncome - totalExpense`.

**Soal 3b (Summary per Kategori):**
- Menggunakan `Map` bawaan JavaScript untuk mengelompokkan data secara efisien berdasarkan kategori (misal: "food", "salary").
- Saat proses *looping* (perulangan) transaksi, jika kategori baru muncul, buat struktur object baru. Jika sudah ada, tinggal ditambahkan `count`, `totalAmount`, dan dibedakan mana `income`/`expense`-nya.
- Terakhir, `Map` diubah kembali menjadi Array, dan rata-ratanya (`avgAmount`) dihitung dengan rumus `totalAmount / count` yang dibulatkan jadi dua desimal menggunakan `.toFixed(2)`.

---

## 4. Daftar Endpoints

- `GET /wallets` : Melihat semua dompet.
- `POST /wallets` : Membuat dompet baru.
- `DELETE /wallets/:id` : Menghapus dompet beserta semua isinya.
- `GET /wallets/:id/transactions` : Melihat seluruh history transaksi pada dompet X.
- `POST /wallets/:id/transactions` : Menambahkan pengeluaran/pemasukan baru pada dompet X.
- `DELETE /transactions/:id` : Menghapus 1 transaksi spesifik.
- `GET /wallets/:id/balance` : Menghitung saldo uang yang tersisa di dompet X.
- `GET /wallets/:id/summary` : Melihat rekap rata-rata per kategori.
