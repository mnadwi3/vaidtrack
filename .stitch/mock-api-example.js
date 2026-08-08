#!/usr/bin/env node
/**
 * Mock API for testing Stitch integration
 * Serves sample doctor and lead data via REST API
 *
 * Usage: node mock-api-example.js
 * Endpoints:
 *   GET /api/doctors          - List all doctors
 *   GET /api/doctors/:id      - Get single doctor
 *   GET /api/leads            - List all leads (pagination)
 *   POST /api/leads           - Create new lead
 *
 * This is just an example. In production, replace with your actual API.
 */

const http = require('http');
const url = require('url');

const PORT = process.env.PORT || 3001;

// Sample doctors data
const DOCTORS = [
  {
    id: 'dr-akshay-tiwari',
    name: 'Dr. Akshay Tiwari',
    specialty: 'Oncology',
    experience_years: 12,
    hospital: 'Apollo Delhi',
    qualification: 'MD, DNB Oncology',
    updated_at: new Date().toISOString()
  },
  {
    id: 'dr-priya-sharma',
    name: 'Dr. Priya Sharma',
    specialty: 'Surgical Oncology',
    experience_years: 8,
    hospital: 'Max Delhi',
    qualification: 'MS, MCh Surgical Oncology',
    updated_at: new Date().toISOString()
  },
  {
    id: 'dr-rajesh-gupta',
    name: 'Dr. Rajesh Gupta',
    specialty: 'Medical Oncology',
    experience_years: 15,
    hospital: 'Fortis Delhi',
    qualification: 'MD, DM Medical Oncology',
    updated_at: new Date().toISOString()
  }
];

// In-memory storage for leads (in production, use a database)
let LEADS = [];
let LEAD_ID_COUNTER = 1;

/**
 * Simple HTTP server handling Stitch API requests
 */
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Routes
  if (pathname === '/api/doctors' && req.method === 'GET') {
    handleGetDoctors(res, query);
  } else if (pathname.match(/^\/api\/doctors\/[^/]+$/) && req.method === 'GET') {
    const id = pathname.split('/').pop();
    handleGetDoctor(res, id);
  } else if (pathname === '/api/leads' && req.method === 'GET') {
    handleGetLeads(res, query);
  } else if (pathname === '/api/leads' && req.method === 'POST') {
    handleCreateLead(req, res);
  } else if (pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok' }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

/**
 * GET /api/doctors - List all doctors
 * Supports pagination: ?limit=10&offset=0
 * Supports filtering: ?specialty=Oncology&updated_since=2024-01-01T00:00:00Z
 */
function handleGetDoctors(res, query) {
  let results = [...DOCTORS];

  // Filter by specialty
  if (query.specialty) {
    results = results.filter(d =>
      d.specialty.toLowerCase().includes(query.specialty.toLowerCase())
    );
  }

  // Filter by updated_since (for incremental sync)
  if (query.updated_since) {
    const since = new Date(query.updated_since);
    results = results.filter(d => new Date(d.updated_at) >= since);
  }

  // Pagination
  const limit = parseInt(query.limit) || 10;
  const offset = parseInt(query.offset) || 0;
  const total = results.length;
  const paginated = results.slice(offset, offset + limit);

  res.writeHead(200);
  res.end(JSON.stringify({
    data: paginated,
    meta: {
      total,
      limit,
      offset,
      has_more: offset + limit < total
    }
  }));
}

/**
 * GET /api/doctors/:id - Get single doctor
 */
function handleGetDoctor(res, id) {
  const doctor = DOCTORS.find(d => d.id === id);
  if (!doctor) {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Doctor not found' }));
    return;
  }
  res.writeHead(200);
  res.end(JSON.stringify(doctor));
}

/**
 * GET /api/leads - List all leads
 * Supports pagination: ?limit=10&offset=0
 * Supports filtering: ?status=new&updated_since=2024-01-01T00:00:00Z
 */
function handleGetLeads(res, query) {
  let results = [...LEADS];

  // Filter by status
  if (query.status) {
    results = results.filter(l => l.status === query.status);
  }

  // Filter by updated_since (for incremental sync)
  if (query.updated_since) {
    const since = new Date(query.updated_since);
    results = results.filter(l => new Date(l.updated_at) >= since);
  }

  // Pagination
  const limit = parseInt(query.limit) || 10;
  const offset = parseInt(query.offset) || 0;
  const total = results.length;
  const paginated = results.slice(offset, offset + limit);

  res.writeHead(200);
  res.end(JSON.stringify({
    data: paginated,
    meta: {
      total,
      limit,
      offset,
      has_more: offset + limit < total
    }
  }));
}

/**
 * POST /api/leads - Create new lead
 */
function handleCreateLead(req, res) {
  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      const data = JSON.parse(body);
      const lead = {
        id: `lead-${LEAD_ID_COUNTER++}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        treatment_type: data.treatment_type,
        message: data.message || '',
        source: data.source || 'api',
        status: 'new',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      LEADS.push(lead);
      res.writeHead(201);
      res.end(JSON.stringify(lead));
    } catch (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: 'Invalid JSON' }));
    }
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║  VaidTrack Mock API                            ║
║  Listening on http://localhost:${PORT}              ║
╚════════════════════════════════════════════════╝

Endpoints:
  GET  /api/doctors?limit=10&offset=0  - List doctors
  GET  /api/doctors/:id                - Get doctor
  GET  /api/leads?limit=10&offset=0    - List leads
  POST /api/leads                      - Create lead
  GET  /health                         - Health check

Test:
  curl http://localhost:${PORT}/api/doctors
  curl -X POST http://localhost:${PORT}/api/leads \\
    -H "Content-Type: application/json" \\
    -d '{"name":"John","email":"john@example.com","treatment_type":"breast-cancer"}'

Setup Stitch source:
  1. Base URL: http://localhost:${PORT}
  2. Endpoint: /api/doctors
  3. Incremental key: updated_at
  4. Sync interval: 60 minutes

To stop: Ctrl+C
  `);
});

process.on('SIGINT', () => {
  console.log('\nServer stopped.');
  process.exit(0);
});
