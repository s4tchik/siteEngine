const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Настройка Multer для загрузки файлов
const upload = multer({ dest: 'uploads/' });

// Путь к файлу JSON для хранения данных
const DATA_FILE = path.join(__dirname, 'data', 'lessons.json');

// Создание папки data, если её нет
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Инициализация файла данных
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(
            Array.from({ length: 35 }, (_, i) => ({
                title: `Урок ${i + 1}`,
                description: `Описание урока ${i + 1}.`,
                task: `Задание для урока ${i + 1}.`,
                videoUrl: '',
                completed: false,
                filePath: null,
            }))
        )
    );
}

// Чтение данных из файла
function readData() {
    const rawData = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(rawData);
}

// Запись данных в файл
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Маршрут для получения уроков
app.get('/api/lessons', (req, res) => {
    const data = readData();
    res.json(data);
});

// Маршрут для завершения урока
app.post('/api/complete-lesson', upload.single('file'), async (req, res) => {
    const { lesson } = req.body;
    const file = req.file;

    if (!file) {
        return res.status(400).json({ error: 'Файл не был загружен.' });
    }

    const data = readData();

    if (lesson > 0 && lesson <= data.length) {
        data[lesson - 1].completed = true;
        data[lesson - 1].filePath = `/uploads/${file.filename}`; // Сохраняем путь к файлу
        writeData(data);
    }

    res.json({ lessons: data });
});

// Маршрут для редактирования урока
app.put('/api/lessons/:index', (req, res) => {
    const { index } = req.params;
    const updatedLesson = req.body;
    const data = readData();

    if (index >= 0 && index < data.length) {
        data[index] = { ...data[index], ...updatedLesson };
        writeData(data);
    }

    res.json({ success: true });
});

// Маршрут для обнуления прогресса
app.post('/api/reset-progress', (req, res) => {
    const data = readData();
    const resetData = data.map(lesson => ({ ...lesson, completed: false, filePath: null }));
    writeData(resetData);
    res.json({ success: true });
});

// Маршрут для скачивания файлов
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Обработка ошибок занятости порта
let server;
try {
    server = app.listen(PORT, () => {
        console.log(`Сервер запущен на http://localhost:${PORT}`);
    });
} catch (error) {
    if (error.code === 'EADDRINUSE') {
        console.error(`Порт ${PORT} уже занят. Попробуйте использовать другой порт.`);
        process.exit(1); // Завершаем процесс с ошибкой
    }
}

// Обработка сигнала завершения (например, Ctrl+C)
process.on('SIGINT', () => {
    console.log('\nСервер остановлен.');
    server.close(() => {
        process.exit(0);
    });
});