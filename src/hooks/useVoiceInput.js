import { useState, useEffect, useCallback } from 'react';

export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const [recognition, setRecognition] = useState(null);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'pt-BR';

            rec.onstart = () => setIsListening(true);
            rec.onend = () => setIsListening(false);
            rec.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setError(event.error);
                setIsListening(false);
            };
            rec.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            setRecognition(rec);
        } else {
            setError('Browser not supported');
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognition) {
            setTranscript('');
            setError(null);
            try {
                recognition.start();
            } catch (e) {
                console.error(e);
            }
        }
    }, [recognition]);

    const stopListening = useCallback(() => {
        if (recognition) {
            recognition.stop();
        }
    }, [recognition]);

    return { isListening, transcript, startListening, stopListening, error, isSupported: !!recognition };
}
