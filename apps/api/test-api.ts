import express from 'express';
const app = express();
app.post('/', (req, res) => {
  try {
    req.setTimeout(100);
    res.send('ok');
  } catch(e) {
    res.status(500).send(String(e));
  }
});
app.listen(3002, () => console.log('ready'));
