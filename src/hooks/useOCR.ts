import { useState } from 'react';
import Tesseract from 'tesseract.js';
import { parseReceiptText } from '../utils/ocrParser';

export function useOCR() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    const processImage = async (imageFile) => {
        setIsProcessing(true);
        setProgress(0);
        setError(null);

        try {
            const result = await Tesseract.recognize(
                imageFile,
                'por', // Portuguese
                {
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            setProgress(parseInt(m.progress * 100));
                        }
                    }
                }
            );

            const text = result.data.text;
            const parsedData = parseReceiptText(text);

            setIsProcessing(false);
            return parsedData;

        } catch (err) {
            console.error('OCR Error:', err);
            setError('Falha ao ler imagem. Tente uma foto mais clara.');
            setIsProcessing(false);
            return null;
        }
    };

    return { processImage, isProcessing, progress, error };
}
