import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.SUPABASE_URL || 'https://itedsuldvwzuidmaptcq.supabase.co';
try {
  new URL(supabaseUrl);
} catch (e) {
  console.warn(`Invalid SUPABASE_URL: ${supabaseUrl}. Falling back to default.`);
  supabaseUrl = 'https://itedsuldvwzuidmaptcq.supabase.co';
}

const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_KEY || 'dummy-key-to-prevent-crash';

if (supabaseKey === 'dummy-key-to-prevent-crash') {
  console.warn('WARNING: SUPABASE_ANON_KEY is not set. Database operations will fail.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

const storage = multer.memoryStorage();
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Dashboard Stats
  app.get('/api/dashboard', async (req, res) => {
    try {
      const { count: totalActive } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .not('status', 'in', '("Claim Settled","Claim Closed","Claim Rejected","Deleted")');
        
      const { count: settled } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Claim Settled');
        
      const { count: underReview } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .in('status', ['Under Assessment', 'Under Insurer Review']);
        
      const { count: rejected } = await supabase.from('claims')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'Claim Rejected');
      
      // Aging Logic
      const { data: claims } = await supabase.from('claims')
        .select('date_reported')
        .not('status', 'in', '("Claim Settled","Claim Closed","Claim Rejected","Deleted")');
        
      let newClaims = 0;
      let inProgress = 0;
      let delayed = 0;
      let escalation = 0;
      
      const now = new Date();
      if (claims) {
        claims.forEach(c => {
          const reported = new Date(c.date_reported);
          const diffTime = Math.abs(now.getTime() - reported.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 7) newClaims++;
          else if (diffDays <= 30) inProgress++;
          else if (diffDays <= 90) delayed++;
          else escalation++;
        });
      }

      // Charts
      const { data: statusData } = await supabase.from('claims').select('status').neq('status', 'Deleted');
      const statusChartMap: Record<string, number> = {};
      statusData?.forEach(c => {
        statusChartMap[c.status] = (statusChartMap[c.status] || 0) + 1;
      });
      const statusChart = Object.keys(statusChartMap).map(k => ({ name: k, value: statusChartMap[k] }));

      const { data: insurerData } = await supabase.from('claims').select('insurer_name').neq('status', 'Deleted');
      const insurerChartMap: Record<string, number> = {};
      insurerData?.forEach(c => {
        insurerChartMap[c.insurer_name] = (insurerChartMap[c.insurer_name] || 0) + 1;
      });
      const insurerChart = Object.keys(insurerChartMap).map(k => ({ name: k, value: insurerChartMap[k] }));

      const { data: typeData } = await supabase.from('claims').select('insurance_type').neq('status', 'Deleted');
      const typeChartMap: Record<string, number> = {};
      typeData?.forEach(c => {
        typeChartMap[c.insurance_type] = (typeChartMap[c.insurance_type] || 0) + 1;
      });
      const typeChart = Object.keys(typeChartMap).map(k => ({ name: k, value: typeChartMap[k] }));
      
      res.json({
        metrics: {
          totalActive: totalActive || 0,
          settled: settled || 0,
          underReview: underReview || 0,
          delayed: delayed + escalation,
          rejected: rejected || 0
        },
        aging: { newClaims, inProgress, delayed, escalation },
        charts: { statusChart, insurerChart, typeChart }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
  });

  // Get all claims
  app.get('/api/claims', async (req, res) => {
    const { data, error } = await supabase.from('claims')
      .select('*')
      .neq('status', 'Deleted')
      .order('id', { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  });

  // Get single claim
  app.get('/api/claims/:id', async (req, res) => {
    const { data: claim, error: claimError } = await supabase.from('claims')
      .select('*')
      .eq('id', req.params.id)
      .single();
      
    if (claimError || !claim) return res.status(404).json({ error: 'Claim not found' });
    
    // Join users manually since we might not have foreign keys set up perfectly in Supabase yet
    const { data: activitiesData } = await supabase.from('activities')
      .select('*')
      .eq('claim_id', req.params.id)
      .order('date', { ascending: false });
      
    const { data: usersData } = await supabase.from('users').select('id, name');
    const userMap = new Map((usersData || []).map(u => [u.id, u.name]));
    
    const activities = (activitiesData || []).map(a => ({
      ...a,
      user_name: userMap.get(a.user_id) || 'Unknown User'
    }));
      
    const { data: documents } = await supabase.from('documents')
      .select('*')
      .eq('claim_id', req.params.id)
      .order('upload_date', { ascending: false });
      
    res.json({ claim, activities, documents: documents || [] });
  });

  // Create claim
  app.post('/api/claims', async (req, res) => {
    try {
      const { client_name, policy_number, insurance_type, insurer_name, date_of_loss, date_reported, claim_amount, currency, remarks, user_id } = req.body;
      
      // Generate running number
      const dateObj = new Date();
      const year = dateObj.getFullYear();
      const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
      const monthYear = `${month}${year}`;
      
      const { data: lastClaimData } = await supabase.from('claims')
        .select('claim_number')
        .like('claim_number', `BCI-CLM-${monthYear}-%`)
        .order('claim_number', { ascending: false })
        .limit(1);
        
      const lastClaim = lastClaimData && lastClaimData.length > 0 ? lastClaimData[0] : null;
      
      let nextNum = '0001';
      if (lastClaim) {
        const lastNumStr = lastClaim.claim_number.split('-')[3];
        const lastNum = parseInt(lastNumStr, 10);
        nextNum = (lastNum + 1).toString().padStart(4, '0');
      }
      const claim_number = `BCI-CLM-${monthYear}-${nextNum}`;
      
      const status = 'Claim Registered';
      const last_update_date = new Date().toISOString();

      const { data: newClaim, error } = await supabase.from('claims').insert([{
        claim_number, client_name, policy_number, insurance_type, insurer_name,
        date_of_loss, date_reported, claim_amount, currency, status, last_update_date, remarks
      }]).select().single();
      
      if (error) throw error;
      
      await supabase.from('activities').insert([{
        claim_id: newClaim.id, date: last_update_date, user_id: user_id || 2,
        activity: 'Claim Registered', notes: 'New claim created.'
      }]);

      res.json({ id: newClaim.id, claim_number });
    } catch (error: any) {
      console.error('Error creating claim in server:', error);
      res.status(500).json({ error: error.message || 'Internal Server Error' });
    }
  });

  // Update claim amount
  app.put('/api/claims/:id/amount', async (req, res) => {
    const { claim_amount, currency, user_id } = req.body;
    const last_update_date = new Date().toISOString();
    
    const updateData: any = { claim_amount, last_update_date };
    let notes = `Claim amount updated to ${claim_amount}`;
    
    if (currency) {
      updateData.currency = currency;
      notes = `Claim amount updated to ${claim_amount} ${currency}`;
    }
    
    await supabase.from('claims').update(updateData).eq('id', req.params.id);
    
    await supabase.from('activities').insert([{
      claim_id: req.params.id, date: last_update_date, user_id: user_id || 2,
      activity: 'Amount Updated', notes
    }]);
    
    res.json({ success: true });
  });

  // Update claim status
  app.put('/api/claims/:id/status', async (req, res) => {
    const { status, notes, user_id, settlement_amount } = req.body;
    const last_update_date = new Date().toISOString();
    
    const updateData: any = { status, last_update_date };
    if (settlement_amount !== undefined) {
      updateData.settlement_amount = settlement_amount;
      if (status === 'Claim Settled') {
        updateData.settlement_date = last_update_date.split('T')[0];
      }
    }
    
    await supabase.from('claims').update(updateData).eq('id', req.params.id);
    
    await supabase.from('activities').insert([{
      claim_id: req.params.id, date: last_update_date, user_id: user_id || 2,
      activity: 'Status Updated', notes: notes || `Status changed to ${status}`
    }]);
    
    res.json({ success: true });
  });

  // Upload document
  app.post('/api/claims/:id/documents', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    
    try {
      const { document_type } = req.body;
      const fileExt = req.file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${req.params.id}/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
        
      const url = publicUrlData.publicUrl;
      const upload_date = new Date().toISOString();
      
      await supabase.from('documents').insert([{
        claim_id: req.params.id, document_type, filename: req.file.originalname,
        url, upload_date
      }]);
      
      await supabase.from('activities').insert([{
        claim_id: req.params.id, date: upload_date, user_id: 2,
        activity: 'Document Uploaded', notes: `Uploaded ${document_type}: ${req.file.originalname}`
      }]);

      res.json({ success: true, url });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || 'Failed to upload document' });
    }
  });

  // Add activity note
  app.post('/api/claims/:id/activities', async (req, res) => {
    const { activity, notes, user_id } = req.body;
    const date = new Date().toISOString();
    
    await supabase.from('activities').insert([{
      claim_id: req.params.id, date, user_id: user_id || 2,
      activity: activity || 'Note Added', notes
    }]);
    
    res.json({ success: true });
  });

  // Delete claim
  app.delete('/api/claims/:id', async (req, res) => {
    try {
      const last_update_date = new Date().toISOString();
      await supabase.from('claims').update({ status: 'Deleted', last_update_date }).eq('id', req.params.id);
      
      await supabase.from('activities').insert([{
        claim_id: req.params.id, date: last_update_date, user_id: 2,
        activity: 'Claim Deleted', notes: 'Claim was soft deleted.'
      }]);
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting claim:', error);
      res.status(500).json({ error: 'Failed to delete claim' });
    }
  });

  // Delete document
  app.delete('/api/documents/:id', async (req, res) => {
    try {
      const { data: doc } = await supabase.from('documents').select('*').eq('id', req.params.id).single();
      if (doc) {
        const urlParts = doc.url.split('/public/documents/');
        if (urlParts.length > 1) {
          const filePath = urlParts[1];
          await supabase.storage.from('documents').remove([filePath]);
        }
        
        await supabase.from('documents').delete().eq('id', req.params.id);
        await supabase.from('activities').insert([{
          claim_id: doc.claim_id, date: new Date().toISOString(), user_id: 2,
          activity: 'Document Deleted', notes: `Deleted ${doc.document_type}: ${doc.filename}`
        }]);
      }
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  });

  // Reset Database (Disabled for production security)
  app.post('/api/admin/reset', async (req, res) => {
    res.status(403).json({ error: 'Database reset is disabled in production for security reasons.' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
