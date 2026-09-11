const express = require('express');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const app = express();
app.use(express.json());

// Khởi tạo thư viện
const tts = new MsEdgeTTS();

// Tạo cổng nhận dữ liệu từ n8n
app.post('/api/tts', async (req, res) => {
    try {
        const { text, voice } = req.body;
        
        // Thiết lập giọng đọc và định dạng MP3
        await tts.setMetadata(voice || 'vi-VN-HoaiMyNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
        
        // Trả luồng âm thanh trực tiếp về cho n8n
        const audioStream = tts.toStream(text);
        res.setHeader('Content-Type', 'audio/mpeg');
        audioStream.pipe(res);
        
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Lắng nghe trên Port của Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Bridge đang chạy trên port ${PORT}`);
});