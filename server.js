require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== CONFIGURACIÓN DE BASE DE DATOS ====================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'sindinvent',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null,
    connectTimeout: 30000
};

// ==================== FUNCIÓN PARA OBTENER CONEXIÓN ====================
function getConnection() {
    return mysql.createConnection(dbConfig);
}

// ==================== FUNCIÓN DE VALIDACIÓN (Módulo 10) ====================
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

// ==================== RUTAS POST (GUARDADO) ====================

app.post('/guardar-responsable', (req, res) => {
    const { nombre, telefono, cedula, area } = req.body;

    if (!nombre || !cedula || !area) {
        return res.status(400).send('❌ Faltan datos obligatorios. <a href="index.html">Volver</a>');
    }

    if (!validarCedula(cedula)) {
        console.warn(`⚠️ Intento de registro con cédula inválida: ${cedula}`);
        return res.status(400).send('❌ La cédula ingresada es incorrecta. <a href="index.html">Volver</a>');
    }

    const connection = getConnection();
    const sql = `INSERT INTO responsables (nombre, telefono, cedula, area) VALUES (?, ?, ?, ?)`;

    connection.connect(err => {
        if (err) {
            console.error('❌ Error de conexión:', err);
            return res.status(500).send('❌ Error de conexión a la base de datos');
        }

        connection.query(sql, [nombre, telefono || null, cedula, area], (err, result) => {
            connection.end();
            if (err) {
                console.error('❌ Error al guardar:', err.message);
                return res.status(500).send('❌ Error en el servidor: ' + err.message);
            }
            res.send(`✅ Responsable ${nombre} guardado con éxito.<br><a href="index.html">Volver</a>`);
        });
    });
});

app.post('/guardar-equipo', (req, res) => {
    const { codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor, estado } = req.body;

    const connection = getConnection();
    const sql = `INSERT INTO equipos_informaticos (codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    connection.connect(err => {
        if (err) {
            console.error('❌ Error de conexión:', err);
            return res.status(500).send('❌ Error de conexión a la base de datos');
        }

        connection.query(sql, [codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor || 0, estado || 'Disponible'], (err, result) => {
            connection.end();
            if (err) {
                console.error('❌ Error al guardar equipo:', err.message);
                return res.status(500).send('❌ Error: ' + err.message);
            }
            res.send(`✅ Equipo ${codigo_inventario} guardado.<br><a href="index.html">Volver</a>`);
        });
    });
});

app.post('/guardar-asignacion', (req, res) => {
    const { codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion, observaciones } = req.body;

    const connection = getConnection();
    const sql = `INSERT INTO control_inventario (codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion, estado_equipo, observaciones) VALUES (?, ?, ?, ?, 'Asignado', ?)`;

    connection.connect(err => {
        if (err) {
            console.error('❌ Error de conexión:', err);
            return res.status(500).send('❌ Error de conexión a la base de datos');
        }

        connection.query(sql, [codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion || null, observaciones], (err, result) => {
            connection.end();
            if (err) {
                console.error('❌ Error al asignar:', err.message);
                return res.status(500).send('❌ Error al asignar: ' + err.message);
            }
            res.send(`✅ Asignación registrada.<br><a href="index.html">Volver</a>`);
        });
    });
});

// ==================== RUTAS API (GET) ====================

app.get('/api/responsables', (req, res) => {
    const connection = getConnection();
    connection.connect(err => {
        if (err) return res.status(500).json({ error: err.message });
        connection.query('SELECT * FROM responsables ORDER BY nombre ASC', (err, results) => {
            connection.end();
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

app.get('/api/equipos', (req, res) => {
    const connection = getConnection();
    connection.connect(err => {
        if (err) return res.status(500).json({ error: err.message });
        connection.query('SELECT codigo_inventario, tipo_inventario, marca, modelo FROM equipos_informaticos ORDER BY codigo_inventario ASC', (err, results) => {
            connection.end();
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

app.get('/responsables', (req, res) => {
    const connection = getConnection();
    connection.connect(err => {
        if (err) return res.status(500).json({ error: err.message });
        connection.query('SELECT * FROM responsables ORDER BY nombre ASC', (err, results) => {
            connection.end();
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

app.get('/equipos', (req, res) => {
    const connection = getConnection();
    connection.connect(err => {
        if (err) return res.status(500).json({ error: err.message });
        const sql = `SELECT codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor FROM equipos_informaticos ORDER BY codigo_inventario ASC`;
        connection.query(sql, (err, results) => {
            connection.end();
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

app.get('/api/stats/asignados', (req, res) => {
    const connection = getConnection();
    connection.connect(err => {
        if (err) return res.status(500).json({ error: err.message });
        connection.query("SELECT COUNT(*) AS total FROM control_inventario", (err, results) => {
            connection.end();
            if (err) return res.status(500).json({ error: err.message });
            res.json({ total: results[0].total });
        });
    });
});

app.get('/api/equipos-con-asignacion', (req, res) => {
    const connection = getConnection();
    connection.connect(err => {
        if (err) return res.status(500).json({ error: err.message });
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
        connection.query(sql, (err, results) => {
            connection.end();
            if (err) return res.status(500).json({ error: err.message });
            res.json(results);
        });
    });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📊 Conectando a DB: ${process.env.DB_HOST || 'localhost'}`);
});