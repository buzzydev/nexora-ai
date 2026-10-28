# NEXORA AI (MVP)

Haqiqiy AI chat (real vaqtda streaming) va internet qidiruvi (manbalar bilan).
Stek: Next.js 14, TypeScript, Tailwind CSS.

## Muhit o'zgaruvchilari

| Nomi | Majburiy | Izoh |
|---|---|---|
| `AI_API_KEY` | Ha | AI provayder kaliti (OpenAI yoki unga mos API) |
| `AI_BASE_URL` | Yo'q | Standart: `https://api.openai.com/v1` |
| `AI_MODEL` | Yo'q | Standart: `gpt-4o-mini` |
| `TAVILY_API_KEY` | Yo'q | Internet qidiruvi uchun ([tavily.com](https://tavily.com)). Bo'lmasa, qidiruv o'chiq ishlaydi |
| `RATE_LIMIT_PER_MIN` | Yo'q | Bir IP uchun daqiqasiga so'rovlar soni (standart 20) |

## Lokal ishga tushirish

1. `npm install`
2. `cp .env.example .env.local` va kalitlarni kiriting
3. `npm run dev` va http://localhost:3000 ni oching

Production tekshiruvi: `npm run build && npm start`

---

## Railway'ga joylash (to'liq qo'llanma)

Loyiha Railway uchun tayyor: `railway.json` (build va start sozlamalari), `/api/health` (sog'lik tekshiruvi) va `PORT` o'zgaruvchisini avtomatik o'qiydigan `start` skripti mavjud.

### 1-qadam. Kalitlarni tayyorlang
- **AI kaliti:** [platform.openai.com/api-keys](https://platform.openai.com/api-keys) da yangi kalit yarating.
- **Qidiruv kaliti (ixtiyoriy):** [tavily.com](https://tavily.com) da ro'yxatdan o'tib, API kalitni oling.

### 2-qadam. Kodni GitHub'ga yuklang
```bash
git init
git add .
git commit -m "NEXORA AI"
git branch -M main
git remote add origin https://github.com/<login>/nexora-ai.git
git push -u origin main
```
`.env.local` faylini yuklamang. U `.gitignore` ichida allaqachon bor.

### 3-qadam. Railway'da loyiha yarating
1. [railway.com](https://railway.com) ga GitHub orqali kiring.
2. **New Project → Deploy from GitHub repo** ni bosing.
3. `nexora-ai` repozitoriyasini tanlang (Railway so'rasa, GitHub ilovasiga ruxsat bering).
4. Railway `railway.json` ni topib, loyihani avtomatik build qila boshlaydi. Birinchi build kalitsiz xato bermaydi, kalitlarni keyingi qadamda qo'shasiz.

### 4-qadam. Muhit o'zgaruvchilarini kiriting
1. Servisni oching va **Variables** bo'limiga o'ting.
2. **New Variable** orqali qo'shing:
   - `AI_API_KEY` = sizning AI kalitingiz
   - `TAVILY_API_KEY` = qidiruv kalitingiz
   - (ixtiyoriy) `AI_MODEL`, `AI_BASE_URL`, `RATE_LIMIT_PER_MIN`
3. Saqlang. Railway avtomatik qayta deploy qiladi.

`PORT` ni qo'lda qo'shmang. Railway uni o'zi beradi.

### 5-qadam. Ommaviy domen oling
1. Servisda **Settings → Networking → Generate Domain** ni bosing.
2. `https://<nom>.up.railway.app` manzili paydo bo'ladi. Shu manzilni oching.

Ixtiyoriy: **Custom Domain** orqali o'z domeningizni ulang va DNS'da Railway ko'rsatgan CNAME yozuvini qo'shing.

### 6-qadam. Tekshirish
- `https://<domen>/api/health` → `{"ok":true,"ai":true,"search":true,"model":"..."}` qaytishi kerak. `ai` yoki `search` `false` bo'lsa, kalit kiritilmagan.
- Bosh sahifada savol yuboring. Javob oqib kelsa, AI ishlayapti.
- "Internetdan qidirish" yoqilganda manba kartalari chiqsa, qidiruv ishlayapti.

### Keng tarqalgan muammolar

| Muammo | Sabab va yechim |
|---|---|
| "AI_API_KEY sozlanmagan" | Variables'da kalit yo'q yoki nomi xato. Kiritib, qayta deploy qiling |
| "AI modeli topilmadi..." | Model nomi eskirgan (masalan Groq'da `llama3-8b-8192` o'chirilgan). `AI_MODEL=llama-3.1-8b-instant` qiling |
| "AI xizmati hozir mavjud emas" | Kalit noto'g'ri, hisobda mablag' yo'q yoki `AI_MODEL` mavjud emas. Deploy loglarini ko'ring |
| "Qidiruv sozlanmagan" | `TAVILY_API_KEY` kiritilmagan |
| Healthcheck muvaffaqiyatsiz | **Deployments → View Logs** da build xatosini ko'ring. Node versiyasi 18.18 yoki undan yuqori bo'lishi kerak |
| 429 "Juda ko'p so'rov" | `RATE_LIMIT_PER_MIN` ni oshiring |

### Groq bilan ishlatish
`AI_BASE_URL=https://api.groq.com/openai/v1`, `AI_MODEL=llama-3.1-8b-instant` (yoki `llama-3.3-70b-versatile`). Joriy modellar ro'yxati: console.groq.com/docs/models

### Muhim eslatmalar
- Kalitlarni skrinshot yoki chatda ulashmang. Ulashgan bo'lsangiz, kalitni o'chirib yangisini yarating.
- Hozirgi MVP'da suhbatlar foydalanuvchi **brauzerida** (localStorage) saqlanadi. Server qayta ishga tushsa ham ular yo'qolmaydi, lekin boshqa qurilmada ko'rinmaydi. Qurilmalar o'rtasida sinxronlash uchun keyingi bosqichda Railway'da PostgreSQL ulanadi (**New → Database → PostgreSQL**).
- Tezlik limiti server xotirasida ishlaydi. Bitta nusxa (replica) bilan to'g'ri ishlaydi. Bir nechta nusxaga o'tsangiz, Redis kerak bo'ladi.
- API kalitlarini hech qachon GitHub'ga yuklamang, faqat Railway Variables'da saqlang.
