import { useState, useEffect, useCallback, useRef } from 'react';

export function useVoiceInput() {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null);
    const [isSupported, setIsSupported] = useState(false);

    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            setIsSupported(true);
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            const rec = new SpeechRecognition();
            rec.continuous = false;
            rec.interimResults = false;
            rec.lang = 'pt-BR';

            rec.onstart = () => {
                setIsListening(true);
                setError(null);
            };

            rec.onend = () => {
                setIsListening(false);
            };

            rec.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                let msg = 'Erro no reconhecimento.';
                if (event.error === 'not-allowed') msg = 'Permissão de microfone negada.';
                if (event.error === 'no-speech') msg = 'Nenhuma fala detectada.';
                if (event.error === 'network') msg = 'Erro de rede/conexão.';
                setError(msg);
                setIsListening(false);
            };

            rec.onresult = (event) => {
                const current = event.resultIndex;
                const transcriptText = event.results[current][0].transcript;
                setTranscript(transcriptText);
            };

            recognitionRef.current = rec;
        } else {
            setError('Navegador não suporta voz.');
            setIsSupported(false);
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current) {
            setTranscript('');
            setError(null);
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Start error:", e);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
    }, []);

    return { isListening, transcript, startListening, stopListening, error, isSupported };
}
