require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const path = require('path');

const app = express();

// ==================== MIDDLEWARE ====================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==================== CONEXIÓN A MYSQL CON RECONEXIÓN AUTOMÁTICA ====================
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_NAME || 'sindinvent',
    port: parseInt(process.env.DB_PORT) || 3306,
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null,
    connectTimeout: 60000,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

let db = mysql.createConnection(dbConfig);

function handleDisconnect() {
    db.connect(err => {
        if (err) {
            console.error('❌ Error al conectar MySQL:', err);
            setTimeout(handleDisconnect, 2000);
        } else {
            console.log('✅ Conectado correctamente a la base de datos');
        }
    });

    db.on('error', err => {
        console.error('❌ Error en MySQL:', err);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.log('🔄 Reconectando...');
            db = mysql.createConnection(dbConfig);
            handleDisconnect();
        } else {
            throw err;
        }
    });
}

handleDisconnect();

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

    const sql = `INSERT INTO responsables (nombre, telefono, cedula, area) VALUES (?, ?, ?, ?)`;
    db.query(sql, [nombre, telefono || null, cedula, area], (err) => {
        if (err) {
            console.error('❌ Error al guardar:', err.message);
            return res.status(500).send('❌ Error en el servidor: ' + err.message);
        }
        res.send(`✅ Responsable ${nombre} guardado con éxito.<br><a href="index.html">Volver</a>`);
    });
});

app.post('/guardar-equipo', (req, res) => {
    const { codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor, estado } = req.body;
    const sql = `INSERT INTO equipos_informaticos (codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor, estado) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.query(sql, [codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor || 0, estado || 'Disponible'], (err) => {
        if (err) return res.status(500).send('❌ Error: ' + err.message);
        res.send(`✅ Equipo guardado.<br><a href="index.html">Volver</a>`);
    });
});

app.post('/guardar-asignacion', (req, res) => {
    const { codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion, observaciones } = req.body;
    const sql = `INSERT INTO control_inventario (codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion, estado_equipo, observaciones) VALUES (?, ?, ?, ?, 'Asignado', ?)`;
    db.query(sql, [codigo_inventario, responsable_id, fecha_asignada, fecha_devolucion || null, observaciones], (err) => {
        if (err) return res.status(500).send('❌ Error al asignar: ' + err.message);
        res.send(`✅ Asignación registrada.<br><a href="index.html">Volver</a>`);
    });
});

// ==================== RUTAS API (GET) ====================

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
        if (err) {
            console.error('Error en consulta:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

app.get('/equipos', (req, res) => {
    const sql = `SELECT codigo_inventario, tipo_inventario, marca, modelo, numero_serie, valor FROM equipos_informaticos ORDER BY codigo_inventario ASC`;
    db.query(sql, (err, results) => {
        if (err) {
            console.error('❌ Error en la base de datos:', err.message);
            return res.status(500).json({ error: 'Error interno del servidor' });
        }
        res.json(results);
    });
});

app.get('/api/stats/asignados', (req, res) => {
    db.query("SELECT COUNT(*) AS total FROM control_inventario", (err, results) => {
        if (err) {
            console.error("Error en conteo:", err);
            return res.status(500).json({ error: err.message });
        }
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
const PORT = process.env.SERVER_PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});