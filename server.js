const express = require('express');
const path = require('path');
const nodemailer = require('nodemailer');
const { supabase } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 6001;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const apiRouter = express.Router();

apiRouter.post('/consultation', async (req, res) => {
  try {
    const { name, email, date, additional_info } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    let dates = [];
    try {
      if (date && date.trim()) {
        const parsed = JSON.parse(date);
        dates = Array.isArray(parsed) ? parsed : [parsed];
      }
    } catch (e) {
      console.error('Date parse error:', e);
      dates = date ? [date] : [];
    }

    if (!dates || dates.length === 0 || (dates.length === 1 && !dates[0])) {
      return res.status(400).json({ error: 'Please select at least one date' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const { data, error } = await supabase
      .from('consultations')
      .insert([
        {
          name,
          email,
          date: dates.join(', '),
          additional_info: additional_info || null,
          verification_code: verificationCode,
          verified: false,
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Database error: ' + error.message });
    }

    const datesDisplay = dates.map(d => {
      const dt = new Date(d + 'T00:00:00');
      return dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }).join(', ');

    const verificationUrl = `http://localhost:${PORT}/api/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify your consultation request - Shannon Cosmetics',
      html: `
        <h2>Thank you for your consultation request, ${name}!</h2>
        <p>Please verify your email address by clicking the link below:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>Or enter this code: <strong>${verificationCode}</strong></p>
        <p>Your preferred dates:</p>
        <ul>
          ${dates.map(d => {
            const dt = new Date(d + 'T00:00:00');
            return `<li>${dt.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</li>`;
          }).join('')}
        </ul>
        <p>Additional Info: ${additional_info || 'None'}</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Consultation submitted. Please check your email to verify.' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to process consultation' });
  }
});

apiRouter.get('/verify', async (req, res) => {
  try {
    const { email, code } = req.query;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const { data, error } = await supabase
      .from('consultations')
      .select('*')
      .eq('email', email)
      .eq('verification_code', code)
      .single();

    if (error || !data) {
      return res.send('<h1>Verification failed</h1><p>Invalid verification code.</p>');
    }

    await supabase
      .from('consultations')
      .update({ verified: true })
      .eq('email', email)
      .eq('verification_code', code);

    res.send(`
      <h1>Email Verified!</h1>
      <p>Thank you, ${data.name}. Your consultation request has been verified.</p>
      <p>We will contact you at ${data.email} shortly.</p>
      <a href="/">Return to home</a>
    `);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Verification failed' });
  }
});

apiRouter.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and code are required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    const { data: allRecords, error: listError } = await supabase
      .from('consultations')
      .select('id, email, verification_code, verified, created_at')
      .ilike('email', trimmedEmail)
      .order('created_at', { ascending: false });

    if (listError || !allRecords || allRecords.length === 0) {
      return res.status(400).json({ success: false, error: 'No consultation found for this email' });
    }

    const matchingRecord = allRecords.find(r => r.verification_code === trimmedCode);

    if (!matchingRecord) {
      return res.status(400).json({ success: false, error: 'Invalid verification code' });
    }

    const data = matchingRecord;

    await supabase
      .from('consultations')
      .update({ verified: true })
      .eq('id', data.id);

    res.json({ success: true, message: 'Your email has been verified! We will contact you shortly.' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
});


apiRouter.post('/resend', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const { data: existing, error: fetchError } = await supabase
      .from('consultations')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (fetchError || !existing) {
      return res.status(404).json({ error: 'No consultation found for this email' });
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    await supabase
      .from('consultations')
      .update({ verification_code: verificationCode })
      .eq('email', email);

    const verificationUrl = `http://localhost:${PORT}/api/verify?email=${encodeURIComponent(email)}&code=${verificationCode}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New Verification Code - Shannon Cosmetics',
      html: `
        <h2>Your New Verification Code</h2>
        <p>Here is your new verification code: <strong>${verificationCode}</strong></p>
        <p>Or click the link below:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: 'Verification code resent' });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: 'Failed to resend code' });
  }
});

app.use('/api', apiRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
