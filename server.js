// ============================================================
// Taller final - Programación de Redes (CIAF)
// Servicio web: Consulta y registro de estado de envíos
// ============================================================
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ------------------------------------------------------------
// VALOR DE N DEL EQUIPO
// N = número de lista (listado oficial) del primer integrante
// del equipo ordenado alfabéticamente por apellido.
// N del equipo = 4
// ------------------------------------------------------------
const N = process.env.EQUIPO_N || 4;   // Equipo: Correa Osorio (Nº 4) es el primero por apellido

const HEADER_EQUIPO = 'x-red-equipo';           // Express normaliza los headers a minúsculas
const VALOR_ESPERADO = `CIAF-${N}`;
const VALOR_RESPUESTA = `Equipo-${N}`;

// ------------------------------------------------------------
// 1. CORS: solo se permite explícitamente este origen
// ------------------------------------------------------------
const ORIGEN_PERMITIDO = 'http://localhost:5500';

app.use(cors({
  origin: ORIGEN_PERMITIDO,                       // -> Access-Control-Allow-Origin: http://localhost:5500
  methods: ['GET', 'POST'],                       // -> Access-Control-Allow-Methods
  allowedHeaders: ['Content-Type', 'X-Red-Equipo'], // -> Access-Control-Allow-Headers
  exposedHeaders: ['X-Servidor-Procesado']        // permite que el navegador lea nuestro header
}));

// Parseo de cuerpos JSON
app.use(express.json());

// ------------------------------------------------------------
// 2. Middleware de validación del encabezado X-Red-Equipo
// ------------------------------------------------------------
function validarEquipo(req, res, next) {
  // Las peticiones preflight (OPTIONS) del navegador no envían headers personalizados
  if (req.method === 'OPTIONS') return next();

  const valor = req.headers[HEADER_EQUIPO];

  if (!valor) {
    return res.status(401).json({
      error: 'Unauthorized',
      mensaje: 'Falta el encabezado obligatorio X-Red-Equipo. La solicitud fue bloqueada.'
    });
  }

  if (valor !== VALOR_ESPERADO) {
    return res.status(401).json({
      error: 'Unauthorized',
      mensaje: 'El valor del encabezado X-Red-Equipo no es válido.',
      recibido: valor
    });
  }

  // Encabezado de respuesta personalizado en las respuestas exitosas
  res.set('X-Servidor-Procesado', VALOR_RESPUESTA);
  next();
}

app.use('/api', validarEquipo);

// ------------------------------------------------------------
// 3. Datos de ejemplo (en memoria)
// ------------------------------------------------------------
const envios = [
  { guia: 'ENV-1001', origen: 'Pereira', destino: 'Bogotá',   estado: 'En tránsito', actualizado: '2026-11-20T10:15:00Z' },
  { guia: 'ENV-1002', origen: 'Pereira', destino: 'Medellín', estado: 'Entregado',   actualizado: '2026-11-19T16:40:00Z' },
  { guia: 'ENV-1003', origen: 'Cali',    destino: 'Pereira',  estado: 'En bodega',   actualizado: '2026-11-21T08:05:00Z' }
];

// ------------------------------------------------------------
// 4. Endpoints
// ------------------------------------------------------------

// GET /api/recurso -> lista de envíos (o uno por ?guia=ENV-1001)
app.get('/api/recurso', (req, res) => {
  const { guia } = req.query;
  if (guia) {
    const envio = envios.find(e => e.guia === guia);
    if (!envio) return res.status(404).json({ error: 'Not Found', mensaje: `No existe la guía ${guia}` });
    return res.status(200).json(envio);
  }
  res.status(200).json({ total: envios.length, envios });
});

// POST /api/recurso -> registrar un nuevo envío (JSON)
app.post('/api/recurso', (req, res) => {
  const { origen, destino } = req.body || {};

  if (!origen || !destino) {
    return res.status(400).json({
      error: 'Bad Request',
      mensaje: 'Los campos "origen" y "destino" son obligatorios.'
    });
  }

  const nuevo = {
    guia: `ENV-${1001 + envios.length}`,
    origen,
    destino,
    estado: 'Registrado',
    actualizado: new Date().toISOString()
  };
  envios.push(nuevo);
  res.status(201).json({ mensaje: 'Envío registrado correctamente', envio: nuevo });
});

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', mensaje: `Ruta ${req.method} ${req.originalUrl} no existe` });
});

app.listen(PORT, () => {
  console.log(`Servidor de envíos escuchando en http://localhost:${PORT}`);
  console.log(`Header requerido: X-Red-Equipo: ${VALOR_ESPERADO}`);
  console.log(`Origen CORS permitido: ${ORIGEN_PERMITIDO}`);
});
