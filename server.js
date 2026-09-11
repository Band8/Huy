const express = require('express');
const { MsEdgeTTS } = require('msedge-tts');

const app = express();
app.use(express.json());

const tts = new MsEdgeTTS();

app.post('/api/tts', async (req, res) => {
    try {
        const { text, voice } = req.body;
        
        // 1. Kiểm tra xem n8n có gửi text sang không
        if (!text) {
            return res.status(400).json({ error: "Không tìm thấy nội dung cần đọc (biến text bị trống)." });
        }

        // 2. Cài đặt giọng đọc. Dùng trực tiếp chuỗi string để tránh lỗi enum undefined của thư viện
        await tts.setMetadata(
            voice || 'vi-VN-HoaiMyNeural',
            'audio-24khz-48kbitrate-mono-mp3'
        );
        
        // 3. Gọi hàm tạo âm thanh
        const streamResponse = tts.toStream(text);
        
        // 4. Khắc phục sự khác biệt giữa các phiên bản msedge-tts
        // Bản mới trả về object { audioStream }, bản cũ trả về trực tiếp ReadableStream
        const readable = streamResponse.audioStream ? streamResponse.audioStream : streamResponse;

        res.setHeader('Content-Type', 'audio/mpeg');

        // 5. Bắt đầu đẩy luồng audio mp3 về lại cho n8n
        if (typeof readable.pipe === 'function') {
            readable.pipe(res);
        } else {
            // Cách xử lý an toàn nếu thư viện không hỗ trợ pipe
            readable.on('data', (data) => res.write(data));
            readable.on('close', () => res.end());
            readable.on('closed', () => res.end());
            readable.on('error', (err) => {
                console.error("Lỗi Stream:", err);
                if (!res.headersSent) res.status(500).json({ error: String(err) });
            });
        }
        
    } catch (error) {
        console.error("Lỗi Server:", error);
        // Ép kiểu lỗi thành chữ để tránh việc n8n nhận về "{}"
        res.status(500).json({ error: String(error.message || error) });
    }
});

// Trả lời thân thiện khi truy cập bằng trình duyệt web
app.get('/', (req, res) => {
    res.send('Máy chủ Edge TTS API Bridge đang hoạt động cực kỳ mượt mà!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API Bridge đang chạy trên port ${PORT}`);
});