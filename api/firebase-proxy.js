export default async function handler(req, res) {
  // تنظیم CORS برای دسترسی بدون مشکل فرانت‌اند
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { path } = req.query;
  const PROJECT_ID = "mojtamerubika1";
  
  // آدرس مستقیم REST API فایربیس
  const firebaseUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${path || ''}`;

  try {
    const options = {
      method: req.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
      options.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const response = await fetch(firebaseUrl, options);
    const data = await response.json();

    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'خطا در ارتباط با سرور فایربیس', details: error.message });
  }
}
