module.exports = {
  apps: [
    {
      name: "hospital-pos",
      script: "node_modules/next/dist/bin/next",
      // Pastikan IP dan Port sesuai dengan instruksi network RS
      args: "start -H 10.48.3.2 -p 3003",
      // "max" akan mendeteksi dan menggunakan SEMUA core CPU tersedia (Cluster/Load Balancer)
      instances: "max", 
      exec_mode: "cluster", // Mengaktifkan load balancing bawaan PM2 antar instances
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
