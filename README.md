1. Jalankan **npm install**
2. buat .env di root folder isinya (
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=laporkan_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=secretkey
JWT_EXPIRES_IN=7d
)
3.jalankan **psql -U postgres -d laporkan_db -f src/config/db.sql** diterminal gunanya untuk ngepush schema database yang sudah dibuat
4. jalankan **npm run dev** untuk melihat hasil nya
