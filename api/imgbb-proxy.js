export default async function handler(req, res) {
  // تنظیم CORS برای دسترسی فرانت‌اند
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'فقط درخواست POST مجاز است' });
  }

  const IMGBB_API_KEY = "32b44cf4a92e03d876d7d02104feabfb";

  try {
    const { image } = req.body; // تصویر به صورت base64 ارسال می‌شود

    if (!image) {
      return res.status(400).json({ error: 'تصویری ارسال نشده است' });
    }

    // آماده‌سازی داده‌ها برای ارسال به ImgBB
    const formData = new URLSearchParams();
    formData.append('key', IMGBB_API_KEY);
    formData.append('image', image.replace(/^data:image\/\w+;base64,/, ''));

    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.success) {
      return res.status(200).json({
        url: data.data.url,
        display_url: data.data.display_url
      });
    } else {
      return res.status(400).json({ error: 'خطا در آپلود تصویر به ImgBB', details: data });
    }
  } catch (error) {
    return res.status(500).json({ error: 'خطای سرور در آپلود تصویر', details: error.message });
  }
}
