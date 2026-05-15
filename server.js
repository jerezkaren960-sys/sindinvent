require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== CONEXIÓN CON URI ====================
let db;

function connectDB() {
    if (process.env.DATABASE_URL) {
        // Usar URI completa (Aiven)
        db = mysql.createConnection(process.env.DATABASE_URL);
    } else {
        // Usar variables separadas (local)
        db = mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sindinvent',
            port: process.env.DB_PORT || 3306
        });
    }

    db.connect(err => {
        if (err) {
            console.error('❌ Error MySQL:', err.message);
            setTimeout(connectDB, 2000);
        } else {
            console.log('✅ Conectado a la base de datos');
        }
    });

    db.on('error', err => {
        console.error('❌ Error en MySQL:', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            connectDB();
        }
    });
}

connectDB();

// ==================== FUNCIÓN PARA QUERYS ====================
function query(sql, params, callback) {
    db.query(sql, params, callback);
}

// ==================== FUNCIÓN DE VALIDACIÓN ====================
function validarCedula(cedula) {
    if (!cedula || cedula.length !== 10 || isNaN(cedula)) return false;
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false;
    let v = cedula.split('').map(Number);
    let suma = 0;
    for (let i = 0; i < 9; i++) {
        let temp = (i % 2 === 0) ? v[i] * 2 : v[i];
        if (temp > 9) temp -= 9;
        suma += temp;
    }
    const digitoVerificador = (suma % 10 === 0) ? 0 : 10 - (suma % 10);
    return digitoVerificador === v[9];
}

// ==================== RUTAS POST ====================

app.post('/guardar-responsable', (req, res) => {
    const { nombre, telefono, cedula, area } = req.body;
    if (!nombre || !cedula || !area) {
        return res.status(400).send('❌ Faltan datos. <a href="index.html">Volver</a>');
    }
    if (!validarCedula(cedula)) {
        return res.status(400).send('❌ Cédula inválida. <a href="index.html">Volver</a>');
    }
    const sql = `INSERT INTO responsables (nombre, telefono, cedula, area) VALUES (?, ?, ?, ?)`;
    db.query(sql, [nombre, telefono || null, cedula, area], (err) => {
        if (err) {
            console.error('❌ Error:', err.message);
            return res.status(500).send('❌ Error: ' + err.message);
        }
        res.send(`✅ Responsable ${nombre} guardado.<br><a href="index.html">Volver</a>`);
    });
});

app.post('/guardar-equipo', (req, res) => {
    const { codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor, estado } = req.body;
    const sql = `INSERT INTO equipos_informaticos (codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor || 0, estado || 'Disponible'], (err) => {
        if (err) return res.status(500).send('❌ Error: ' + err.message);
        res.send(`✅ Equipo ${codigo_inventario} guardado.<br><a href="index.html">Volver</a>`);
    });
});

app.post('/guardar-asignacion', (req, res) => {
    const { codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion, observaciones } = req.body;
    const sql = `INSERT INTO control_inventario (codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion, estado_equipo, observaciones) VALUES (?, ?, ?, ?, 'Asignado', ?)`;
    db.query(sql, [codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion || null, observaciones], (err) => {
        if (err) return res.status(500).send('❌ Error: ' + err.message);
        res.send(`✅ Asignación registrada.<br><a href="index.html">Volver</a>`);
    });
});

// ==================== RUTAS GET ====================

app.get('/api/responsables', (req, res) => {
    db.query('SELECT * FROM responsables ORDER BY nombre ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/equipos', (req, res) => {
    db.query('SELECT codigo_inventario, tipo_inventario, marca, modelo FROM equipos_informaticos ORDER BY codigo_inventario ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/responsables', (req, res) => {
    db.query('SELECT * FROM responsables ORDER BY nombre ASC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/equipos', (req, res) => {
    const sql = `SELECT codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor FROM equipos_informaticos ORDER BY codigo_inventario ASC`;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

app.get('/api/stats/asignados', (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM control_inventario", (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ total: results[0].total });
    });
});

app.get('/api/equipos-con-asignacion', (req, res) => {
    const sql = `
        SELECT
            e.codigo_inventario,
            e.tipo_inventario,
            e.marca,
            e.modelo,
            r.area AS area_resultado,
            COALESCE(r.nombre, 'Sin asignar') AS nombre_responsable,
            c.fecha_asignada
        FROM equipos_informaticos e
        LEFT JOIN control_inventario c ON e.codigo_inventario = c.codigo_inventario
        LEFT JOIN responsables r ON c.responsable_id = r.cedula
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor en http://localhost:${PORT}`);
});