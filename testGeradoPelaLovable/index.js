/**
 * Backend Node.js para rodar em VPS separada
 * Este arquivo se conecta ao banco de dados Supabase e fornece endpoints para queries e inserts
 * 
 * Para usar:
 * 1. Copie esta pasta para sua VPS
 * 2. Execute: npm install express @supabase/supabase-js cors dotenv
 * 3. Configure as variáveis de ambiente no arquivo .env
 * 4. Execute: node index.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ==================== ENDPOINTS DE CLIENTES ====================

// GET - Listar todos os clientes
app.get('/api/clients', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Buscar cliente por ID
app.get('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET - Buscar clientes por status
app.get('/api/clients/status/:status', async (req, res) => {
  try {
    const { status } = req.params;
    
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar clientes por status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ...existing code...
// GET - Buscar clientes pela coluna owner (email)
app.get('/api/clients/owner/:email', async (req, res) => {
  try {
    const { email } = req.params;

    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('ownerEmail', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar clientes por owner:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// POST - Criar novo cliente
app.post('/api/clients', async (req, res) => {
  try {
    const { name, value, notes, status, user_id } = req.body;

    // Validação básica
    if (!name || !user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome e user_id são obrigatórios' 
      });
    }

    const { data, error } = await supabase
      .from('clients')
      .insert([
        {
          name,
          value: value || 0,
          notes: notes || null,
          status: status || 'waiting',
          user_id
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT - Atualizar cliente
app.put('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, value, notes, status } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (value !== undefined) updateData.value = value;
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from('clients')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE - Excluir cliente
app.delete('/api/clients/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ENDPOINTS DE PROFILES ====================

// GET - Buscar perfil por user_id
app.get('/api/profiles/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user_id)
      .single();

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== ENDPOINT DE SAÚDE ====================

app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend está rodando',
    timestamp: new Date().toISOString()
  });
});

// ==================== ENDPOINT RAIZ ====================

app.get('/', (req, res) => {
  res.json({
    message: 'API do Sistema Kanban CRM',
    version: '1.0.0',
    endpoints: {
      clients: {
        list: 'GET /api/clients',
        get: 'GET /api/clients/:id',
        byStatus: 'GET /api/clients/status/:status',
        create: 'POST /api/clients',
        update: 'PUT /api/clients/:id',
        delete: 'DELETE /api/clients/:id'
      },
      profiles: {
        get: 'GET /api/profiles/:user_id'
      },
      health: 'GET /health'
    }
  });
});

// ==================== INICIAR SERVIDOR ====================

app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`✅ Conectado ao Supabase: ${supabaseUrl}`);
});

// Tratamento de erros não capturados
process.on('unhandledRejection', (error) => {
  console.error('❌ Erro não tratado:', error);
});