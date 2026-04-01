import express, { Request, Response } from 'express';
import cors from 'cors';
import { exec } from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'ffmpeg-static';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const TEMP_DIR = path.join(__dirname, '../temp');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

app.get('/api/health', (req: Request, res: Response) => {
    res.status(200).json({ message: 'API de descarga funcionando correctamente' });
});

// ¡Asegúrate de que sea app.post y no app.get!
app.post('/api/download-audio', async (req: Request, res: Response): Promise<void> => {
    // Volvemos a leer la URL desde el body, como lo manda la app móvil
    const { url } = req.body;

    if (!url || typeof url !== 'string') {
        res.status(400).json({ error: 'Debes de proporcionar una URL valida' });
        return;
    }

    const fileName = `audio_${Date.now()}.mp3`;
    const outputPath = path.join(TEMP_DIR, `${fileName}.%(ext)s`);

    console.log(`Iniciando descarga de audio para URL: ${url}`);

    try {
        await exec(url, { 
            extractAudio: true,
            audioFormat: 'mp3',
            audioQuality: 0,
            output: outputPath,
            noWarnings: true,
            ffmpegLocation: ffmpeg || undefined, 
            cookies: path.join(__dirname, '../cookies.txt'),
            
            // 👇 Aquí está la magia: le pedimos 'best' para que no falle si YouTube oculta el audio puro
            format: 'best',
        });

        console.log('Descarga y conversion completados');

        const finalFilePath = path.join(TEMP_DIR, `${fileName}.mp3`);

        if (!fs.existsSync(finalFilePath)) {
            res.status(500).json({ error: 'Error al procesar el archivo descargado' });
            return;
        }

        res.download(finalFilePath, 'audio_descargado.mp3', (err) => {
            if (err) {
                console.error('Error al enviar el archivo al cliente:', err);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'Error al enviar el archivo de audio' });
                }
            }

            fs.unlink(finalFilePath, (unlinkErr) => {
                if (unlinkErr) {
                    console.error(`Error al eliminar el archivo temporal ${finalFilePath}:`, unlinkErr);
                } else {
                    console.log(`Archivo temporal ${finalFilePath} eliminado con exito`);
                }
            });
        });
    } catch (error: any) {
        console.error('Error durante la descarga o conversion:', error.Message || error);

        res.status(500).json({
            error: 'Error al procesar el enlace.',
            details: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log(`El servidor esta corriendo en http://192.168.1.11:${PORT}`);
    console.log(`Recuerda que debes tener FFmpeg en tu sistema para que la conversion a MP3 funcione`);
})