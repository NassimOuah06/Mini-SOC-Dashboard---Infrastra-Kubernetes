const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors({
    origin: "*",
    methods: ["GET", "POST", "DELETE", "PUT"]
}));
app.use(express.json());

// Configuration de la connexion
const dbConfig = {
    host: 'mysql-service',
    user: 'root',
    password: 'password',
    database: 'soc_db',
    port: 3306
};

// Utilisation d'un Pool pour plus de stabilité dans K8s
const pool = mysql.createPool(dbConfig);
const db = pool.promise(); // Utilisation des promesses pour un code plus propre

// --- INITIALISATION DE LA BASE ---
async function initDB() {
    try {
        // 1. Création de la table
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS logs (
                id          INT AUTO_INCREMENT PRIMARY KEY,
                timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
                ip          VARCHAR(45) NOT NULL,
                event_type  VARCHAR(100) NOT NULL,
                level       ENUM('CRITICAL', 'WARNING', 'INFO', 'OK') DEFAULT 'INFO',
                message     VARCHAR(255) NOT NULL,
                detail      TEXT NULL,
                INDEX idx_timestamp (timestamp DESC),
                INDEX idx_level (level)
            )
        `;
        await db.query(createTableQuery);
        console.log("✅ Logs table is ready");

        // 2. Vérification si la table est vide avant de peupler (Seed)
        const [rows] = await db.query("SELECT COUNT(*) as count FROM logs");
        if (rows[0].count === 0) {
            console.log("📡 Seeding database with initial logs...");
            await seedDatabase();
            startLiveTraffic();
        }
    } catch (err) {
        console.error("❌ Database Init Error:", err);
        // Dans K8s, on laisse le pod redémarrer si la DB n'est pas prête
        setTimeout(initDB, 5000); 
    }
}

async function seedDatabase() {
    const levels = ['CRITICAL', 'WARNING', 'INFO', 'OK'];
    const eventTypes = ["SSH Bruteforce", "Large File Transfer", "Nginx 404 Error", "Firewall Allow", "SQL Injection Attempt", "Port Scan Detected"];
    const ips = ["192.168.1.105", "10.0.0.50", "172.16.0.2", "192.168.1.1"];
    const messages = ["Multiple failed login attempts", "Large outbound data transfer", "Unauthorized file access attempt"];

    for (let i = 0; i < 50; i++) {
        const randomHoursAgo = Math.floor(Math.random() * 24);
        const timestamp = new Date(Date.now() - randomHoursAgo * 60 * 60 * 1000);
        
        await db.query(
            "INSERT INTO logs (timestamp, ip, event_type, level, message, detail) VALUES (?, ?, ?, ?, ?, ?)",
            [
                timestamp,
                ips[Math.floor(Math.random() * ips.length)],
                eventTypes[Math.floor(Math.random() * eventTypes.length)],
                levels[Math.floor(Math.random() * levels.length)],
                messages[Math.floor(Math.random() * messages.length)],
                `Seed log entry #${i}`
            ]
        );
    }
    console.log("✅ Seeding complete!");
}
function startLiveTraffic() {
    console.log("🛠️  Démarrage du simulateur de trafic temps réel...");

    const eventTypes = [
        { type: "SSH Bruteforce", msg: "Tentative de connexion root échouée", lvl: "CRITICAL" },
        { type: "Nginx 404 Error", msg: "Accès suspect à /admin/config.php", lvl: "WARNING" },
        { type: "Firewall Allow", msg: "Trafic autorisé sur le port 80", lvl: "OK" },
        { type: "Port Scan", msg: "Scan de ports détecté (Nmap)", lvl: "WARNING" },
        { type: "SQL Injection", msg: "Caractère suspect (') détecté dans l'URL", lvl: "CRITICAL" },
        { type: "System Update", msg: "Mise à jour automatique des packages", lvl: "INFO" }
    ];

    const ips = ["192.168.1.105", "10.0.0.50", "172.16.0.2", "45.67.89.123", "203.0.113.45"];

    // Génère un log toutes les 10 secondes
    setInterval(async () => {
        const event = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const ip = ips[Math.floor(Math.random() * ips.length)];
        const detail = `Auto-generated event: ${Math.random().toString(36).substring(7)}`;

        try {
            await db.query(
                "INSERT INTO logs (ip, event_type, level, message, detail) VALUES (?, ?, ?, ?, ?)",
                [ip, event.type, event.lvl, event.msg, detail]
            );
            console.log(`📡 Nouveau log généré : [${event.lvl}] ${event.type}`);
        } catch (err) {
            console.error("❌ Erreur lors de l'auto-log:", err.message);
        }
    }, 7000); // 7000ms = 7 secondes
}

initDB();

// ======================== API ROUTES ========================

// GET /logs - Tous les logs
app.get('/logs', async (req, res) => {
    try {
        const [results] = await db.query("SELECT * FROM logs ORDER BY timestamp DESC LIMIT 999");
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Database error", error: err.message });
    }
});

// GET /alerts - Uniquement Critical et Warning
app.get('/alerts', async (req, res) => {
    try {
        const [results] = await db.query(
            "SELECT * FROM logs WHERE level IN ('CRITICAL', 'WARNING') ORDER BY timestamp DESC LIMIT 99"
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// POST /logs - Ajouter un log manuellement
app.post('/logs', async (req, res) => {
    const { ip, event_type, level, message, detail } = req.body;
    try {
        const [result] = await db.query(
            "INSERT INTO logs (ip, event_type, level, message, detail) VALUES (?, ?, ?, ?, ?)",
            [ip, event_type, level || 'INFO', message, detail || null]
        );
        res.status(201).json({ id: result.insertId, ip, event_type });
    } catch (err) {
        res.status(500).json({ message: "Database error" });
    }
});

// Health Check pour Kubernetes
app.get('/health', (req, res) => res.send("OK"));

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});