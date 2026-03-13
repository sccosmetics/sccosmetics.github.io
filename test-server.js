const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());

app.get('/api/test', (req, res) => res.json({ok: true}));

app.post('/api/verify', (req, res) => {
  res.json({success: true, message: 'works'});
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(9001, () => console.log('Test server on 9001'));
