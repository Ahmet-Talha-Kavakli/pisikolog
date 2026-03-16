
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CONFIG } from './config.js';
import { Client } from 'node-osc';

const oscClient = new Client('127.0.0.1', 8000); // Unreal OSC Default Port

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PERSISTENT_MEMORY_FILE = path.join(__dirname, 'persistent_memory.json');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ─── ROOT (Basit Hoşgeldin) ─────────────────────────
app.get('/', (req, res) => {
    res.send('<h1>Lyra Brain is Running 🌌</h1><p>Visit <a href="/ping">/ping</a> to check status.</p>');
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- DUYGU DURUMU TAKİBİ ---
const userEmotions = new Map(); // userId -> { duygu, guven, timestamp }

// ─── HAFIZA YÖNETİMİ ──────────────────────────────────────
const getPersistentMemory = () => {
    if (!fs.existsSync(PERSISTENT_MEMORY_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(PERSISTENT_MEMORY_FILE, 'utf8')); }
    catch (e) { return {}; }
};
const savePersistentMemory = (data) => {
    fs.writeFileSync(PERSISTENT_MEMORY_FILE, JSON.stringify(data, null, 2));
};

// ─── PING (Tünel sağlık kontrolü) ─────────────────────────
app.get('/ping', (req, res) => {
    res.send('Lyra Brain is ALIVE! 🌌');
});

// ─── HAFIZA OKUMA (Browser'dan çağrılır, arama başlamadan önce) ────────────
app.get('/memory', (req, res) => {
    const userId = req.query.userId;
    const allMemory = getPersistentMemory();
    const memory = userId ? (allMemory[userId] || '') : '';
    console.log(`[MEMORY READ] userId: ${userId}, hasMemory: ${!!memory}`);
    res.json({ memory });
});

function buildSystemPrompt(userSummary) {
    const memoryContext = userSummary
        ? `\n\n[SENİN BU KULLANICI HAKKINDAKİ KALICI HAFIZAN]:\n${userSummary}\n\nBu bilgileri temel alarak ama asla hissettirmeden doğal şekilde konuş.`
        : '\n\n[Bu kullanıcıyla ilk görüşmedesin. Onu tanımaya çalış.]';
    return CONFIG.SYSTEM_PROMPT.replace(/\[APP_NAME\]/g, CONFIG.APP_NAME) + memoryContext;
}

// ─── VAPI WEBHOOK (Arama bitince hafızayı kaydet) ─────────────────────────
app.post('/vapi-webhook', async (req, res) => {
    const { message } = req.body;
    if (!message) return res.json({});

    const msgType = message.type;
    console.log(`[VAPI WEBHOOK] Type: ${msgType}`);

    // Real-time lip-sync data from Vapi
    if (msgType === 'conversation-update' || msgType === 'speech-update') {
        const amplitude = message.analyzer?.amplitude || 0;
        // Send to Unreal via OSC
        oscClient.send('/vapi/amplitude', amplitude, () => {
            // Optional: console.log(`[OSC] Sent amplitude: ${amplitude}`);
        });
    }

    if (msgType === 'end-of-call-report') {
        const callId = message.call?.id || 'unknown';
        const transcript = message.transcript || '';

        // metadata'dan userId'yi al (start()'ta gönderdik)
        const userId = message.call?.metadata?.userId || callId;

        if (!transcript || transcript.length < 50) {
            console.log('[END OF CALL] Konuşma çok kısa, özetlenmiyor.');
            return res.json({});
        }

        console.log(`[END OF CALL] Özetleniyor... userId: ${userId}`);
        try {
            const summaryResponse = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `Kullanıcı ile yapılan konuşmayı analiz et ve şu bilgileri kısa maddeler halinde özetle:
- Kullanıcının adı (varsa)
- Temel endişeleri ve sorunları
- Kişilik özellikleri ve ruh hali
- Lyra'nın bir dahaki seferde hatırlaması gereken önemli detaylar
Maksimum 150 kelime.`
                    },
                    { role: 'user', content: `Konuşma:\n${transcript}` }
                ],
                max_tokens: 250
            });

            const summary = summaryResponse.choices[0].message.content;
            const allMemory = getPersistentMemory();
            allMemory[userId] = summary;
            savePersistentMemory(allMemory);
            console.log(`[BRAIN ASCENSION] ✅ Hafıza mühürlendi! userId: ${userId}`);
            console.log(`[BRAIN ASCENSION] Özet: ${summary.substring(0, 100)}...`);
        } catch (err) {
            console.error('[BRAIN ASCENSION] ❌ Özetleme hatası:', err.message);
        }
    }

    res.json({});
});

// ─── LOCAL MEMORY ENDPOINT (NO TUNNEL REQUIRED) ───────────
app.post('/save-local-memory', async (req, res) => {
    const { userId, transcript } = req.body;
    
    if (!userId || !transcript || transcript.length < 50) {
        return res.sendStatus(200);
    }

    console.log(`[LOCAL MEMORY] Özetleniyor... userId: ${userId}`);
    try {
        const summaryResponse = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: `Kullanıcı ile yapılan konuşmayı analiz et ve şu bilgileri kısa maddeler halinde özetle:
- Kullanıcının adı (varsa)
- Temel endişeleri ve sorunları
- Kişilik özellikleri ve ruh hali
- Lyra'nın bir dahaki seferde hatırlaması gereken önemli detaylar
Maksimum 150 kelime.`
                },
                { role: 'user', content: `Konuşma:\n${transcript}` }
            ],
            max_tokens: 250
        });

        const summary = summaryResponse.choices[0].message.content;
        const allMemory = getPersistentMemory();
        allMemory[userId] = summary;
        savePersistentMemory(allMemory);
        
        console.log(`[LOCAL MEMORY] ✅ Hafıza başarıyla kaydedildi!`);
        console.log(`[LOCAL MEMORY] Özet: ${summary.substring(0, 100)}...`);
    } catch (err) {
        console.error('[LOCAL MEMORY] ❌ Özetleme hatası:', err.message);
    }
});

// ─── CUSTOM LLM ENDPOINT (VAPI İÇİN BEYİN) ────────────────
app.post('/api/chat/completions', async (req, res) => {
    try {
        const { messages, model, temperature, max_tokens } = req.body;
        console.log(`[CUSTOM LLM] İstek alındı! Gelen mesaj sayısı: ${messages?.length}`);

        // Vapi'den userId'yi çıkarmaya çalış
        // 1. req.body.call.customer.number (varsa)
        // 2. req.body.call.id
        // 3. metadata.userId (bizim gönderdiğimiz)
        const callData = req.body.call || {};
        const userId = callData.customer?.number || callData.id || req.body.metadata?.userId || 'common_user';
        
        console.log(`[CUSTOM LLM] Kullanıcı ID: ${userId}`);
        
        const latestEmotion = userEmotions.get(userId);
        const enrichedMessages = [...messages];
        
        if (latestEmotion) {
            console.log(`[CUSTOM LLM] 🎭 Duygu Enjeksiyonu: ${latestEmotion.duygu} (%${latestEmotion.guven})`);
            const systemIdx = enrichedMessages.findIndex(m => m.role === 'system');
            if (systemIdx !== -1) {
                enrichedMessages[systemIdx] = {
                    ...enrichedMessages[systemIdx],
                    content: enrichedMessages[systemIdx].content + `\n\n[GİZLİ DUYGU VERİSİ - Kamera Analizi]: Kullanıcı şu an ${latestEmotion.duygu} görünüyor (%${latestEmotion.guven} güven). Bu duyguyu cevaba doğal şekilde yansıt (örn: sakinse sen de sakin kal, çok korkmuşsa teselli et).`
                };
            }
        }

        const response = await openai.chat.completions.create({
            model: model || 'gpt-4o',
            messages: enrichedMessages,
            stream: true,
            temperature: temperature || 0.7,
            max_tokens: max_tokens || 500,
        });

        // Vapi'ye gerçek zamanlı (Server-Sent Events) aktarım
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of response) {
            res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
        res.write('data: [DONE]\n\n');
        res.end();
        console.log(`[CUSTOM LLM] 🧠 Cevap başarıyla akıtıldı.`);
    } catch (error) {
        console.error("[CUSTOM LLM] ❌ Hata:", error);
        res.status(500).json({ error: error.message });
    }
});

// ─── YÜZDEN DUYGU ANALİZİ (GPT-4o Vision) ────────────────
app.post('/analyze-emotion', async (req, res) => {
    try {
        const { imageBase64, userId } = req.body;
        if (!imageBase64) return res.json({ duygu: 'sakin', guven: 0 });

        const response = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [{
                role: 'user',
                content: [
                    { type: 'text', text: 'Bu yüzün duygusunu analiz et. Sadece JSON döndür: {"duygu":"mutlu|üzgün|endişeli|korkmuş|sakin|şaşırmış|sinirli","guven":80}' },
                    { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}`, detail: 'low' } }
                ]
            }],
            max_tokens: 60
        });

        let result = { duygu: 'sakin', guven: 50 };
        try {
            const raw = response.choices[0].message.content.trim().replace(/```json|```/g, '');
            result = JSON.parse(raw);
        } catch { /* parse hatası */ }
        
        // Son tespiti kaydet
        if (userId) {
            userEmotions.set(userId, { ...result, timestamp: Date.now() });
        }
        
        console.log(`[DUYGU] ${userId || '?'}: ${result.duygu} %${result.guven}`);
        res.json(result);
    } catch (err) {
        console.error('[DUYGU] Hata:', err.message);
        res.json({ duygu: 'sakin', guven: 0 });
    }
});

// ─── SUNUCU BAŞLAT ────────────────────────────────────────
app.listen(port, () => {
    console.log('-------------------------------------------');
    console.log('🚀 Lyra Brain Sunucusu Çalışıyor!');
    console.log(`📍 Port: ${port}`);
    console.log('🧠 Mimari: Vapi Native + Webhook Memory');
    console.log('-------------------------------------------');
});
