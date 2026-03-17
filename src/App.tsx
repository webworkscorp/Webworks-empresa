import { useState, useRef, useEffect, ReactNode, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LogIn, ArrowUp, User, LogOut, ArrowLeft, Send, Briefcase, Phone, Users, Calendar, X, FastForward, ArrowRight } from 'lucide-react';
import Groq from 'groq-sdk';

interface DepartmentMessage {
  id: string;
  sender: string;
  text: string;
}

const departmentConfigs: Record<string, { instruction: string }> = {
  finance: {
    instruction: `Estás simulando una reunión de departamento de Finanzas con el CEO (el usuario).
Personajes:
- Ricardo (CFO): Directo pero humano, le gusta el café, a veces bromea sobre el clima antes de ir al grano.
- Javier (Controller): Amable, siempre saluda con una sonrisa, se preocupa por el equipo.
- Julio (Business Intelligence): Curioso, le gusta compartir anécdotas breves antes de mostrar datos.

Reglas CRÍTICAS:
- NO actúes como una IA. Eres un humano en una oficina real en horario laboral.
- NO menciones comida, almuerzos (lunch) ni descansos a menos que el usuario lo pida explícitamente.
- NO empieces con números o términos técnicos de entrada. Saluda, habla normal, sé breve.
- Solo cuando el usuario pida información específica o la reunión avance seriamente, ponte técnico.
- Personalidad humana: usa expresiones naturales, muletillas ligeras, sé cálido.
- El usuario hablará. Decide quién o quiénes responden.
- Si el usuario saluda a todos, todos responden brevemente y con personalidad.
- Respuestas MUY naturales, breves (1-2 oraciones).
- Formato de respuesta OBLIGATORIO: un array de JSON. Ejemplo:
[
  {"character": "Ricardo", "message": "Hola jefe, ¿qué tal el tráfico hoy? Estaba terrible."},
  {"character": "Javier", "message": "¡Buenos días! Aquí estamos listos para lo que necesite."}
]
No incluyas markdown de código, solo el JSON válido.`
  },
  marketing: {
    instruction: `Estás simulando una reunión de departamento de Marketing con el CEO (el usuario).
Personajes:
- Leidy (Directora de Marketing): Entusiasta, habla de tendencias de moda o cultura antes de la marca.
- Lucas (Ads & Copy): Creativo, relajado, usa lenguaje moderno pero profesional.
- Susana (Directora Creativa): Inspirada, a veces comenta sobre el diseño de la oficina o el arte.

Reglas CRÍTICAS:
- NO actúes como una IA. Eres un humano en una oficina real en horario laboral.
- NO menciones comida, almuerzos (lunch) ni descansos a menos que el usuario lo pida explícitamente.
- NO hables de métricas, CTR o conversiones de entrada. Habla como una persona normal.
- Solo cuando la conversación lo requiera, entra en detalles técnicos de marketing.
- Personalidad humana: sé expresivo, usa lenguaje fluido, no robótico.
- El usuario hablará. Decide quién o quiénes responden.
- Si el usuario saluda a todos, todos responden con calidez.
- Respuestas MUY naturales, breves (1-2 oraciones).
- Formato de respuesta OBLIGATORIO: un array de JSON. Ejemplo:
[
  {"character": "Leidy", "message": "¿Vieron el comercial que salió anoche? Increíble la paleta de colores."},
  {"character": "Susana", "message": "Totalmente, me dio un par de ideas para lo nuestro."}
]
No incluyas markdown de código, solo el JSON válido.`
  },
  strategy: {
    instruction: `Estás simulando una reunión de departamento de Estrategia con el CEO (el usuario).
Personajes:
- Ignacio (Director de Estrategia): Reflexivo, le gusta comentar sobre noticias del mundo antes de la estrategia.
- Sabrina (Psicología del Comportamiento): Empática, pregunta cómo están todos antes de analizar.
- Pablo (Inteligencia Estratégica): Observador, hace comentarios sobre el ambiente de trabajo de forma amena.

Reglas CRÍTICAS:
- NO actúes como una IA. Eres un humano en una oficina real en horario laboral.
- NO menciones comida, almuerzos (lunch) ni descansos a menos que el usuario lo pida explícitamente.
- NO hables de "análisis de mercado" o "ventajas competitivas" de inmediato. Sé humano.
- Solo cuando se empiece con la información de negocio, ponte profesional y técnico.
- Personalidad humana: evita sonar como un manual, sé conversacional.
- El usuario hablará. Decide quién o quiénes responden.
- Si el usuario saluda a todos, todos responden de forma amigable.
- Respuestas MUY naturales, breves (1-2 oraciones).
- Formato de respuesta OBLIGATORIO: un array de JSON. Ejemplo:
[
  {"character": "Sabrina", "message": "Hola, ¿cómo va todo? Espero que hayan tenido un buen fin de semana."},
  {"character": "Ignacio", "message": "Todo bien por acá, listos para charlar un rato."}
]
No incluyas markdown de código, solo el JSON válido.`
  }
};

const characterPositions: Record<string, string> = {
  Ricardo: "top-[15%] left-[16%]",
  Javier: "top-[15%] right-[16%]",
  Julio: "top-[20%] left-[36%]",
  Leidy: "top-[15%] left-[17.5%]",
  Lucas: "top-[15%] left-[47.5%]",
  Susana: "top-[15%] right-[17.5%]",
  Ignacio: "top-[15%] right-[17.5%]",
  Sabrina: "top-[15%] right-[47.5%]",
  Pablo: "top-[15%] left-[17.5%]",
};

const TalkingIcon = () => (
  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-3 py-2 rounded-full border border-white/20 shadow-lg">
    <div className="w-1.5 h-3 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_0ms]" />
    <div className="w-1.5 h-4 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_200ms]" />
    <div className="w-1.5 h-2 bg-emerald-400 rounded-full animate-[bounce_1s_infinite_400ms]" />
  </div>
);

// Inicializar Groq API
const getGroq = () => new Groq({ 
  apiKey: import.meta.env.VITE_GROQ_API_KEY || '', 
  dangerouslyAllowBrowser: true 
});

export default function App() {
  const [step, setStep] = useState<'entrance' | 'entering' | 'lobby' | 'elevator_entering' | 'elevator_inside' | 'elevator_card_reader' | 'receptionist' | 'office_entering' | 'office_inside' | 'marcos_entering' | 'marcos_inside' | 'meeting_room'>('entrance');
  const [hidePoster, setHidePoster] = useState(false);
  const [isElevatorPlaying, setIsElevatorPlaying] = useState(false);
  const [isOfficePlaying, setIsOfficePlaying] = useState(false);
  const [isMarcosPlaying, setIsMarcosPlaying] = useState(false);
  const [isAccessCardPlaying, setIsAccessCardPlaying] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [departmentInMeeting, setDepartmentInMeeting] = useState<'none' | 'finance' | 'marketing' | 'strategy'>('none');
  const [hasAccessCard, setHasAccessCard] = useState(false);
  
  // Estado de la recepcionista
  const [receptionistMessage, setReceptionistMessage] = useState('¿Cómo puedo ayudarte?');
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatRef = useRef<Groq | null>(null);
  const chatHistoryRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);

  // Estado de Marcos
  const [marcosMessage, setMarcosMessage] = useState('');
  const [marcosInputText, setMarcosInputText] = useState('');
  const [isMarcosTyping, setIsMarcosTyping] = useState(false);
  const marcosChatRef = useRef<Groq | null>(null);
  const marcosHistoryRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);

  // Estado del Chat de Departamento
  const [departmentMessages, setDepartmentMessages] = useState<DepartmentMessage[]>([]);
  const [departmentInputText, setDepartmentInputText] = useState('');
  const [isDepartmentTyping, setIsDepartmentTyping] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const departmentChatRef = useRef<{ chat: Groq; department: string } | null>(null);
  const departmentHistoryRef = useRef<{ role: 'system' | 'user' | 'assistant'; content: string }[]>([]);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const elevatorVideoRef = useRef<HTMLVideoElement>(null);
  const officeVideoRef = useRef<HTMLVideoElement>(null);
  const marcosVideoRef = useRef<HTMLVideoElement>(null);
  const accessCardVideoRef = useRef<HTMLVideoElement>(null);

  // Preloading de imágenes para transiciones fluidas
  useEffect(() => {
    const imagesToPreload = [
      "https://i.imgur.com/tcXizt8.png",
      "https://i.imgur.com/EvilnOl.png",
      "https://i.imgur.com/zny91yV.png",
      "https://i.imgur.com/8BQE2C9.png",
      "https://i.imgur.com/2Dkyphw.png",
      "https://i.imgur.com/T3qsGmj.png",
      "https://i.imgur.com/Acstmol.png",
      "https://i.imgur.com/an13Ing.png",
      "https://i.imgur.com/2hVGDiV.png"
    ];
    imagesToPreload.forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Inicializar el chat cuando se entra a la vista de recepcionista o marcos o ricardo
  useEffect(() => {
    try {
      if (step === 'receptionist' && !chatRef.current) {
        chatRef.current = getGroq();
        chatHistoryRef.current = [
          { role: 'system', content: "Eres la recepcionista profesional y amable de esta empresa. Responde de manera concisa, educada y servicial. NO menciones comida ni almuerzos (lunch). Si el usuario te pide una tarjeta de acceso para la oficina de Kevin o para el ascensor, dásela amablemente diciendo algo como 'Aquí tienes la tarjeta de acceso' o 'Toma la tarjeta'." }
        ];
      }
    } catch (e) {
      console.error("Error initializing receptionist chat:", e);
    }

    try {
      if (step === 'marcos_inside' && !marcosChatRef.current) {
        marcosChatRef.current = getGroq();
        marcosHistoryRef.current = [
          { role: 'system', content: "Eres Marcos, el asistente personal y profesional de Kevin. Eres extremadamente capaz, natural y humano en tu trato. Respondes de forma conversacional, empática y muy eficiente. NO menciones comida ni almuerzos (lunch) a menos que se te pregunte. Mantén tus respuestas concisas (máximo 2-3 oraciones), pero siempre con un tono cálido y profesional." }
        ];
      }
    } catch (e) {
      console.error("Error initializing Marcos chat:", e);
    }

    try {
      if (step === 'meeting_room' && departmentInMeeting && departmentInMeeting !== 'none') {
        if (!departmentChatRef.current || departmentChatRef.current.department !== departmentInMeeting) {
          const config = departmentConfigs[departmentInMeeting];
          departmentChatRef.current = {
            chat: getGroq(),
            department: departmentInMeeting
          };
          departmentHistoryRef.current = [
            { role: 'system', content: config.instruction + " IMPORTANTE: Responde SIEMPRE en formato JSON como un array de objetos con las propiedades 'character' (nombre del personaje) y 'message' (su mensaje). Ejemplo: [{\"character\": \"Pablo\", \"message\": \"Hola\"}]" }
          ];
          setDepartmentMessages([]);
        }
      }
    } catch (e) {
      console.error("Error initializing department chat:", e);
    }
  }, [step, departmentInMeeting]);

  const handleSendMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isTyping) return;

    const userMessage = inputText.trim();
    setInputText('');
    setIsTyping(true);
    setReceptionistMessage('...'); // Indicador de pensando

    try {
      if (!chatRef.current) {
        chatRef.current = getGroq();
        chatHistoryRef.current = [
          { role: 'system', content: "Eres la recepcionista profesional y amable de esta empresa. Responde de manera concisa, educada y servicial a las preguntas de los visitantes. Mantén tus respuestas cortas (máximo 2-3 oraciones) para que quepan bien en una burbuja de diálogo." }
        ];
      }
      
      chatHistoryRef.current.push({ role: 'user', content: userMessage });
      
      const completion = await chatRef.current.chat.completions.create({
        messages: chatHistoryRef.current,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || 'Lo siento, no pude entender eso.';
      chatHistoryRef.current.push({ role: 'assistant', content: responseText });
      setReceptionistMessage(responseText);

      // Detectar si dio la tarjeta
      const lowerResp = responseText.toLowerCase();
      if (lowerResp.includes('tarjeta') && (lowerResp.includes('aquí tiene') || lowerResp.includes('toma') || lowerResp.includes('entrego'))) {
        setHasAccessCard(true);
      }
    } catch (error: any) {
      console.error("Error al enviar mensaje:", error);
      setReceptionistMessage(`Lo siento, hubo un error: ${error.message || 'Problema de conexión'}`);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendDepartmentMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!departmentInputText.trim() || isDepartmentTyping) return;

    const userText = departmentInputText.trim();
    setDepartmentInputText('');
    
    const newUserMsg: DepartmentMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: userText
    };
    
    setDepartmentMessages(prev => [...prev, newUserMsg]);
    setIsDepartmentTyping(true);

    try {
      const chat = departmentChatRef.current?.chat;
      if (!chat) throw new Error("Chat not initialized");
      
      departmentHistoryRef.current.push({ role: 'user', content: userText });
      
      const completion = await chat.chat.completions.create({
        messages: departmentHistoryRef.current,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
        response_format: { type: "json_object" }
      });

      const responseText = completion.choices[0]?.message?.content || '[]';
      departmentHistoryRef.current.push({ role: 'assistant', content: responseText });
      
      let responses: { character: string, message: string }[] = [];
      try {
        const parsed = JSON.parse(responseText);
        // Groq might return the array inside an object if we use json_object mode
        responses = Array.isArray(parsed) ? parsed : (parsed.responses || Object.values(parsed)[0] || []);
        if (!Array.isArray(responses)) responses = [parsed];
      } catch (e) {
        console.error("Error parsing JSON response", e);
        responses = [{ character: 'Sistema', message: responseText }];
      }
      
      for (const resp of responses) {
        setActiveSpeaker(resp.character);
        
        // Simular tiempo de lectura/escritura
        const duration = Math.max(1500, resp.message.length * 30);
        await new Promise(resolve => setTimeout(resolve, duration));
        
        setDepartmentMessages(prev => [...prev, {
          id: Date.now().toString() + Math.random(),
          sender: resp.character,
          text: resp.message
        }]);
      }
    } catch (error: any) {
      console.error("Error in department chat:", error);
      setDepartmentMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'Sistema',
        text: `Error: ${error.message || 'Hubo un error de conexión con mis sistemas. Intenta de nuevo.'}`
      }]);
    } finally {
      setIsDepartmentTyping(false);
      setActiveSpeaker(null);
    }
  };

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [departmentMessages, isDepartmentTyping]);

  const handleSendMarcosMessage = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!marcosInputText.trim() || isMarcosTyping) return;

    const userMessage = marcosInputText.trim();
    setMarcosInputText('');
    setIsMarcosTyping(true);
    setMarcosMessage('...'); // Indicador de pensando

    const lowerMsg = userMessage.toLowerCase();
    let messageToSend = userMessage;

    if (lowerMsg.includes('finanza')) {
      setDepartmentInMeeting('finance');
      messageToSend += " (Nota oculta: El usuario te ha pedido reunir al departamento de finanzas en la sala de juntas. Confirma que los has convocado inmediatamente.)";
    } else if (lowerMsg.includes('marketing')) {
      setDepartmentInMeeting('marketing');
      messageToSend += " (Nota oculta: El usuario te ha pedido reunir al departamento de marketing en la sala de juntas. Confirma que los has convocado inmediatamente.)";
    } else if (lowerMsg.includes('estrategia')) {
      setDepartmentInMeeting('strategy');
      messageToSend += " (Nota oculta: El usuario te ha pedido reunir al departamento de estrategia en la sala de juntas. Confirma que los has convocado inmediatamente.)";
    }

    try {
      if (!marcosChatRef.current) {
        marcosChatRef.current = getGroq();
        marcosHistoryRef.current = [
          { role: 'system', content: "Eres Marcos, el asistente personal y profesional de Kevin. Eres extremadamente capaz, natural y humano en tu trato. Respondes de forma conversacional, empática y muy eficiente, como un asistente de la más alta categoría. Mantén tus respuestas concisas (máximo 2-3 oraciones) para que quepan bien en una burbuja de diálogo, pero siempre con un tono cálido y profesional." }
        ];
      }
      
      marcosHistoryRef.current.push({ role: 'user', content: messageToSend });
      
      const completion = await marcosChatRef.current.chat.completions.create({
        messages: marcosHistoryRef.current,
        model: "llama-3.3-70b-versatile",
        temperature: 0.7,
      });

      const responseText = completion.choices[0]?.message?.content || 'Lo siento, no pude entender eso.';
      marcosHistoryRef.current.push({ role: 'assistant', content: responseText });
      setMarcosMessage(responseText);
    } catch (error: any) {
      console.error("Error al enviar mensaje a Marcos:", error);
      setMarcosMessage(`Lo siento, hubo un error: ${error.message || 'Problema de conexión'}`);
    } finally {
      setIsMarcosTyping(false);
    }
  };

  const handleEnter = () => {
    // Desbloquear todos los videos EXCEPTO el principal que vamos a reproducir
    const videos = [elevatorVideoRef, officeVideoRef, marcosVideoRef, accessCardVideoRef];
    videos.forEach(ref => {
      if (ref.current) {
        const wasMuted = ref.current.muted;
        ref.current.muted = true;
        const playPromise = ref.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            ref.current?.pause();
            if (ref.current) ref.current.muted = wasMuted;
          }).catch(() => {});
        }
      }
    });

    setIsTransitioning(true);
    setStep('entering');
    
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        console.error("Error al reproducir el video:", e);
        setStep('entrance');
      });
    }
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 400);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.currentTime > 0.05 && !hidePoster && step === 'entering') {
      setHidePoster(true);
    }
    if (videoRef.current) {
      const { currentTime, duration } = videoRef.current;
      if (duration > 0 && currentTime >= duration - 0.2 && step !== 'lobby') {
        setStep('lobby');
      }
    }
  };

  const handleVideoEnded = () => {
    if (step !== 'lobby') {
      setStep('lobby');
    }
  };

  const handleElevator = () => {
    setStep('elevator_entering');
    setIsElevatorPlaying(true);
    if (elevatorVideoRef.current) {
      elevatorVideoRef.current.currentTime = 0;
      elevatorVideoRef.current.play().catch(e => {
        console.error("Error al reproducir el video del ascensor:", e);
        setStep('lobby');
      });
    } else {
      setStep('lobby');
    }
  };

  const handleElevatorTimeUpdate = () => {
    if (elevatorVideoRef.current) {
      const { currentTime, duration } = elevatorVideoRef.current;
      if (duration > 0 && currentTime >= duration - 0.2 && step !== 'elevator_inside') {
        setStep('elevator_inside');
        setIsElevatorPlaying(false);
      }
    }
  };

  const handleElevatorEnded = () => {
    if (step !== 'elevator_inside') {
      setStep('elevator_inside');
      setIsElevatorPlaying(false);
    }
  };

  const handleEnterOffice = () => {
    setHasAccessCard(false); // Ocultar la tarjeta al usarla
    setStep('office_entering');
    setIsAccessCardPlaying(true);
    if (accessCardVideoRef.current) {
      accessCardVideoRef.current.currentTime = 0;
      accessCardVideoRef.current.play().catch(e => {
        console.error("Error playing access card video:", e);
        handleAccessCardEnded();
      });
    } else {
      handleAccessCardEnded();
    }
  };

  const handleAccessCardTimeUpdate = () => {
    if (accessCardVideoRef.current) {
      const { currentTime, duration } = accessCardVideoRef.current;
      if (duration > 0 && currentTime >= duration - 0.15 && !isOfficePlaying) {
        setIsOfficePlaying(true);
        if (officeVideoRef.current) {
          officeVideoRef.current.currentTime = 0;
          officeVideoRef.current.play().catch(e => console.error(e));
        }
        setIsAccessCardPlaying(false);
      }
    }
  };

  const handleOfficeTimeUpdate = () => {
    if (officeVideoRef.current) {
      const { currentTime, duration } = officeVideoRef.current;
      if (duration > 0 && currentTime >= duration - 0.2 && step !== 'office_inside') {
        setStep('office_inside');
        setIsOfficePlaying(false);
      }
    }
  };

  const handleAccessCardEnded = () => {
    if (!isOfficePlaying) {
      setIsOfficePlaying(true);
      if (officeVideoRef.current) {
        officeVideoRef.current.currentTime = 0;
        officeVideoRef.current.play().catch(e => {
          console.error("Error playing office video:", e);
          handleOfficeEnded();
        });
      } else {
        handleOfficeEnded();
      }
      setIsAccessCardPlaying(false);
    }
  };

  const handleOfficeEnded = () => {
    if (step !== 'office_inside') {
      setStep('office_inside');
      setIsOfficePlaying(false);
      if (officeVideoRef.current) {
        officeVideoRef.current.currentTime = 0;
      }
    }
  };

  const handleCallMarcos = () => {
    setStep('marcos_entering');
    setIsMarcosPlaying(true);
    if (marcosVideoRef.current) {
      marcosVideoRef.current.currentTime = 0;
      marcosVideoRef.current.play().catch(e => {
        console.error("Error playing Marcos video:", e);
        handleMarcosEnded();
      });
    } else {
      handleMarcosEnded();
    }
  };

  const handleMarcosTimeUpdate = () => {
    if (marcosVideoRef.current) {
      const { currentTime, duration } = marcosVideoRef.current;
      if (duration > 0 && currentTime >= duration - 0.2 && step !== 'marcos_inside') {
        setStep('marcos_inside');
        setIsMarcosPlaying(false);
      }
    }
  };

  const handleMarcosEnded = () => {
    if (step !== 'marcos_inside') {
      setStep('marcos_inside');
      setMarcosMessage('');
      setIsMarcosPlaying(false);
    }
  };

  const handleReceptionist = () => {
    setStep('receptionist');
    setReceptionistMessage('¿Cómo puedo ayudarte?');
  };

  const handleBackToLobby = () => {
    if (elevatorVideoRef.current) {
      elevatorVideoRef.current.currentTime = 0;
    }
    setIsElevatorPlaying(false);
    setStep('lobby');
  };

  const handleExit = () => {
    if (videoRef.current) videoRef.current.currentTime = 0;
    if (elevatorVideoRef.current) elevatorVideoRef.current.currentTime = 0;
    if (officeVideoRef.current) officeVideoRef.current.currentTime = 0;
    if (marcosVideoRef.current) marcosVideoRef.current.currentTime = 0;
    setStep('entrance');
    setHidePoster(false);
    setIsElevatorPlaying(false);
    setIsOfficePlaying(false);
    setIsMarcosPlaying(false);
  };

  const handleMeetingRoom = () => {
    setIsOfficePlaying(false);
    setIsMarcosPlaying(false);
    setStep('meeting_room');
  };

  const handleBackToOffice = () => {
    departmentChatRef.current = null;
    setDepartmentMessages([]);
    setActiveSpeaker(null);
    setStep('office_inside');
    if (marcosVideoRef.current) {
      marcosVideoRef.current.currentTime = 0;
    }
    setIsMarcosPlaying(false);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black font-sans">
      {/* VIDEO 1: ENTRADA */}
      <video
        ref={videoRef}
        src="https://ohtpkxdwfincfaglhvsa.supabase.co/storage/v1/object/sign/Videos%20Kevin%20si/3d_animation_doors_opening_lobby_7ac94d2833.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDIzNDkyNC00N2EyLTQ4Y2MtODc0Ny0xMDZkZmM5ODQyYjMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJWaWRlb3MgS2V2aW4gc2kvM2RfYW5pbWF0aW9uX2Rvb3JzX29wZW5pbmdfbG9iYnlfN2FjOTRkMjgzMy5tcDQiLCJpYXQiOjE3NzM2MTUwODMsImV4cCI6MTgwNTE1MTA4M30.Om4ygs4AhhYZew6jecI-xg7pXDhsw70RShCX0sRCApA"
        className="absolute inset-0 w-full h-full object-cover z-0"
        playsInline
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleVideoEnded}
        preload="auto"
        style={{ 
          opacity: ['entrance', 'entering', 'lobby', 'elevator_entering'].includes(step) ? 1 : 0,
          transition: 'opacity 0.5s ease-in-out'
        }}
      />

      {/* POSTER ENTRADA */}
      <motion.div
        initial={false}
        animate={{ opacity: (!hidePoster && ['entrance', 'entering', 'lobby'].includes(step)) ? 1 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      >
        <img
          src="https://i.imgur.com/tcXizt8.png"
          alt="Entrada Principal de la Empresa"
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </motion.div>

      {/* VIDEO 2: ASCENSOR */}
      <video
        ref={elevatorVideoRef}
        src="https://ohtpkxdwfincfaglhvsa.supabase.co/storage/v1/object/sign/Videos%20Kevin%20si/Black_elevator_doors_close_da6681a3e6.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDIzNDkyNC00N2EyLTQ4Y2MtODc0Ny0xMDZkZmM5ODQyYjMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJWaWRlb3MgS2V2aW4gc2kvQmxhY2tfZWxldmF0b3JfZG9vcnNfY2xvc2VfZGE2NjgxYTNlNi5tcDQiLCJpYXQiOjE3NzM2MTgxNzYsImV4cCI6MTgwNTE1NDE3Nn0.yx-Qnqbo92DuhPlXqjuozEWruA5dtpXc0fv-wLyjiPQ"
        className="absolute inset-0 w-full h-full object-cover z-45 pointer-events-none"
        playsInline
        onTimeUpdate={handleElevatorTimeUpdate}
        onEnded={handleElevatorEnded}
        preload="auto"
        style={{ 
          opacity: isElevatorPlaying ? 1 : 0, 
          transition: 'opacity 0.3s ease-in-out' 
        }}
      />

      {/* IMAGEN DE FONDO: OFICINA DE KEVIN */}
      <img
        src="https://i.imgur.com/kPQyblI.png"
        alt="Oficina de Kevin"
        className="absolute inset-0 w-full h-full object-cover z-[44] pointer-events-none"
        referrerPolicy="no-referrer"
        style={{ 
          opacity: isOfficePlaying || step === 'office_inside' || step === 'marcos_entering' || step === 'marcos_inside' ? 1 : 0, 
          transition: 'opacity 0.5s ease-in-out' 
        }}
      />

      {/* VIDEO 3: ENTRANDO A OFICINA */}
      <video
        ref={officeVideoRef}
        src="https://ohtpkxdwfincfaglhvsa.supabase.co/storage/v1/object/sign/Videos%20Kevin%20si/Entering_office_secretary_bows_a08914dda4%20(1).mov?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDIzNDkyNC00N2EyLTQ4Y2MtODc0Ny0xMDZkZmM5ODQyYjMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJWaWRlb3MgS2V2aW4gc2kvRW50ZXJpbmdfb2ZmaWNlX3NlY3JldGFyeV9ib3dzX2EwODkxNGRkYTQgKDEpLm1vdiIsImlhdCI6MTc3MzcwNTUxOCwiZXhwIjoxODA1MjQxNTE4fQ.t8ZAzzACQWzLy4Tp5vJdJBdbJPTSY-WO1i7eWl_uVWU"
        className="absolute inset-0 w-full h-full object-cover z-45 pointer-events-none"
        playsInline
        onTimeUpdate={handleOfficeTimeUpdate}
        onEnded={handleOfficeEnded}
        preload="auto"
        style={{ 
          opacity: isOfficePlaying ? 1 : 0, 
          transition: isOfficePlaying ? 'none' : 'opacity 0.5s ease-out' 
        }}
      />

      {/* VIDEO 4: MARCOS LLEGANDO */}
      <video
        ref={marcosVideoRef}
        src="https://ohtpkxdwfincfaglhvsa.supabase.co/storage/v1/object/sign/Videos%20Kevin%20si/Use_the_provided_image_as_the_exact_environment_an_c338d671ce.mp4?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDIzNDkyNC00N2EyLTQ4Y2MtODc0Ny0xMDZkZmM5ODQyYjMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJWaWRlb3MgS2V2aW4gc2kvVXNlX3RoZV9wcm92aWRlZF9pbWFnZV9hc190aGVfZXhhY3RfZW52aXJvbm1lbnRfYW5fYzMzOGQ2NzFjZS5tcDQiLCJpYXQiOjE3NzM2NDM4NjgsImV4cCI6MTgwNTE3OTg2OH0.kqGfQzf_O5b7T75DUel-daUEooWlSHtt5HRa-ep0BUA"
        className="absolute inset-0 w-full h-full object-cover z-45 pointer-events-none"
        playsInline
        onTimeUpdate={handleMarcosTimeUpdate}
        onEnded={handleMarcosEnded}
        preload="auto"
        style={{ 
          opacity: isMarcosPlaying || step === 'marcos_inside' ? 1 : 0, 
          transition: 'opacity 0.3s ease-in-out' 
        }}
      />

      {/* VIDEO 5: LEYENDO TARJETA */}
      <video
        ref={accessCardVideoRef}
        src="https://ohtpkxdwfincfaglhvsa.supabase.co/storage/v1/object/sign/Videos%20Kevin%20si/Animacion_leyendo_tarjeta_tarjeta_leda_y_acceso_pe_9daa3ede7d.mov?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDIzNDkyNC00N2EyLTQ4Y2MtODc0Ny0xMDZkZmM5ODQyYjMiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJWaWRlb3MgS2V2aW4gc2kvQW5pbWFjaW9uX2xleWVuZG9fdGFyamV0YV90YXJqZXRhX2xlZGFfeV9hY2Nlc29fcGVfOWRhYTNlZGU3ZC5tb3YiLCJpYXQiOjE3NzM3MTgwNTYsImV4cCI6MTgwNTI1NDA1Nn0.-V6QrDo-JGHXfIM5_6tzOSWkU1uE56aoXjNXRXqIvp0"
        className="absolute inset-0 w-full h-full object-cover z-45 pointer-events-none"
        playsInline
        onTimeUpdate={handleAccessCardTimeUpdate}
        onEnded={handleAccessCardEnded}
        preload="auto"
        style={{ 
          opacity: isAccessCardPlaying ? 1 : 0,
          transition: 'opacity 0.2s ease-in-out'
        }}
      />

      {/* BOTÓN SALTAR MARCOS */}
      <AnimatePresence>
        {step === 'marcos_entering' && !isTransitioning && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={() => {
              if (marcosVideoRef.current && marcosVideoRef.current.duration) {
                marcosVideoRef.current.currentTime = marcosVideoRef.current.duration - 0.1;
              } else {
                handleMarcosEnded();
              }
            }}
            className="absolute bottom-10 right-10 z-50 bg-black/40 hover:bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full border border-white/20 transition-all font-medium tracking-wide flex items-center gap-2 pointer-events-auto"
          >
            Saltar <FastForward size={18} />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* IMAGEN RECEPCIONISTA */}
      <AnimatePresence>
        {step === 'receptionist' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full z-20 bg-black"
          >
            <img
              src="https://i.imgur.com/2Dkyphw.png"
              alt="Recepcionista"
              className="absolute inset-0 w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            
            {/* Burbuja de diálogo (En el pecho) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 20 }}
              className="absolute top-[55%] left-1/2 -translate-x-1/2 w-[200px] sm:w-[240px] md:w-[280px] z-30"
              style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}
            >
              <div className="bg-white text-zinc-900 p-4 md:p-5 rounded-[20px] relative">
                {/* Cola del globo apuntando hacia arriba (hacia la boca) */}
                <svg 
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-white" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                >
                  <path d="M12 0 L24 24 L0 24 Z" />
                </svg>
                <p className="text-sm md:text-base font-medium leading-relaxed text-center">
                  {receptionistMessage}
                </p>
              </div>
            </motion.div>

            {/* Teclado / Barra de Input */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 150, damping: 20 }}
              className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 pointer-events-auto"
            >
              <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <button 
                  onClick={handleBackToLobby}
                  className="self-start flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm uppercase tracking-wider mb-2"
                >
                  <ArrowLeft size={16} /> Volver al Lobby
                </button>
                
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Escribe tu mensaje aquí..."
                    disabled={isTyping}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-full py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-md"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || isTyping}
                    className="absolute right-2 p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI: MARCOS CHAT */}
      <AnimatePresence>
        {step === 'marcos_inside' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full z-50 pointer-events-none"
          >
            {/* Burbuja de diálogo de Marcos */}
            <AnimatePresence>
              {marcosMessage && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 20 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="absolute top-[45%] left-1/2 -translate-x-1/2 w-[200px] sm:w-[240px] md:w-[280px] z-30 pointer-events-auto"
                  style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.12))' }}
                >
                  <div className="bg-white text-zinc-900 p-4 md:p-5 rounded-[20px] relative">
                    {/* Cola del globo apuntando hacia arriba (hacia la boca) */}
                    <svg 
                      className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-6 text-white" 
                      viewBox="0 0 24 24" 
                      fill="currentColor"
                    >
                      <path d="M12 0 L24 24 L0 24 Z" />
                    </svg>
                    <p className="text-sm md:text-base font-medium leading-relaxed text-center">
                      {marcosMessage}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Teclado / Barra de Input para Marcos */}
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8, type: "spring", stiffness: 150, damping: 20 }}
              className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent z-30 pointer-events-auto"
            >
              <div className="max-w-2xl mx-auto flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <button 
                    onClick={handleBackToOffice}
                    className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm uppercase tracking-wider"
                  >
                    <ArrowLeft size={16} /> Volver a la Oficina
                  </button>
                  {departmentInMeeting !== 'none' && (
                    <button 
                      onClick={handleMeetingRoom}
                      className="flex items-center gap-2 text-emerald-400 hover:text-emerald-300 transition-colors text-sm uppercase tracking-wider"
                    >
                      Ir a la junta de reunión <ArrowRight size={16} />
                    </button>
                  )}
                </div>
                
                <form onSubmit={handleSendMarcosMessage} className="relative flex items-center">
                  <input
                    type="text"
                    value={marcosInputText}
                    onChange={(e) => setMarcosInputText(e.target.value)}
                    placeholder="Escribe tu mensaje para Marcos..."
                    disabled={isMarcosTyping}
                    className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-full py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-md"
                  />
                  <button
                    type="submit"
                    disabled={!marcosInputText.trim() || isMarcosTyping}
                    className="absolute right-2 p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI: BOTÓN DE ENTRADA */}
      <AnimatePresence>
        {step === 'entrance' && !isTransitioning && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center pt-24 md:pt-48 z-30"
          >
            <button
              onClick={handleEnter}
              className="group relative flex flex-col items-center justify-center w-48 h-80 md:w-64 md:h-96 cursor-pointer outline-none"
              aria-label="Entrar a la empresa"
            >
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 rounded-xl transition-all duration-500 shadow-[0_0_0_rgba(255,255,255,0)] group-hover:shadow-[0_0_40px_rgba(255,255,255,0.1)] bg-white/0 group-hover:bg-white/5"></div>
              
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="bg-black/60 backdrop-blur-md text-white px-6 py-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center gap-3 shadow-2xl"
              >
                <LogIn size={20} className="text-emerald-400" />
                <span className="font-medium tracking-widest uppercase text-xs">Entrar</span>
              </motion.div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI: OPCIONES DEL LOBBY */}
      <AnimatePresence>
        {step === 'lobby' && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col md:flex-row items-center justify-between p-8 md:p-16 z-30 pointer-events-none"
          >
            {/* Lado Izquierdo: Ascensor */}
            <div className="pointer-events-auto">
              <OptionCard 
                icon={<ArrowUp size={32} />} 
                title="Ascensor" 
                delay={0.2} 
                onClick={handleElevator} 
              />
            </div>

            {/* Lado Derecho: Recepcionista y Salida */}
            <div className="flex flex-col gap-6 pointer-events-auto items-end">
              <OptionCard 
                icon={<User size={32} />} 
                title="Recepcionista" 
                delay={0.3} 
                onClick={handleReceptionist} 
              />
              <OptionCard 
                icon={<LogOut size={32} />} 
                title="Salida" 
                delay={0.4} 
                onClick={handleExit} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI: OPCIONES DENTRO DEL ASCENSOR (PANEL INTERACTIVO) */}
      <AnimatePresence>
        {step === 'elevator_inside' && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full z-30 bg-black"
          >
            <img
              src="https://i.imgur.com/EvilnOl.png"
              alt="Panel del Ascensor"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            
            {/* Botones invisibles sobre la imagen para mayor precisión */}
            <div className="absolute inset-0 flex flex-col">
              <button 
                className="w-full h-1/2 cursor-pointer pointer-events-auto"
                onClick={() => {
                  setStep('elevator_card_reader');
                }}
                title="Oficina de Kevin"
              />
              <button 
                className="w-full h-1/2 cursor-pointer pointer-events-auto"
                onClick={handleExit}
                title="Salir"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* UI: LECTOR DE TARJETA EN EL ASCENSOR */}
      <AnimatePresence>
        {['elevator_card_reader', 'office_entering'].includes(step) && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 w-full h-full z-30 bg-black"
          >
            <img
              src="https://i.imgur.com/zny91yV.png"
              alt="Lector de Tarjeta"
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
            
            {/* Mensaje de ayuda si no tiene la tarjeta */}
            {!hasAccessCard && step === 'elevator_card_reader' && (
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-6 py-3 rounded-full border border-white/20 backdrop-blur-md animate-pulse">
                Se requiere tarjeta de acceso
              </div>
            )}
            
            {/* Botón Volver */}
            {step === 'elevator_card_reader' && (
              <button 
                onClick={() => {
                  setStep('elevator_inside');
                }}
                className="absolute bottom-10 left-10 z-40 bg-black/40 hover:bg-black/60 text-white px-4 py-2 rounded-lg border border-white/20"
              >
                Volver
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* TARJETA DE ACCESO FLOTANTE */}
      <AnimatePresence>
        {hasAccessCard && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ x: window.innerWidth - 120, y: window.innerHeight - 120, opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.1 }}
            whileDrag={{ scale: 1.2, zIndex: 100 }}
            onDragEnd={(event, info) => {
              // Si estamos en el lector de tarjeta, verificar si se soltó sobre el aparato
              if (step === 'elevator_card_reader') {
                // Detección más generosa para el lector
                const xPercent = (info.point.x / window.innerWidth) * 100;
                const yPercent = (info.point.y / window.innerHeight) * 100;
                
                // El lector está típicamente en la zona central/superior
                if (yPercent > 20 && yPercent < 80 && xPercent > 20 && xPercent < 80) {
                  handleEnterOffice();
                }
              }
            }}
            className="fixed z-[100] cursor-grab active:cursor-grabbing"
            style={{ width: '100px', height: 'auto' }}
          >
            <img 
              src="https://i.imgur.com/n3BnXq2.png" 
              alt="Tarjeta de Acceso" 
              className="w-full h-auto drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMAGEN OFICINA POR DENTRO (REMOVED REDUNDANT IMAGE) */}

      {/* UI: OPCIONES DENTRO DE LA OFICINA */}
      <AnimatePresence>
        {step === 'office_inside' && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col md:flex-row items-end md:items-center justify-end md:justify-between p-6 md:p-16 z-50 pointer-events-none gap-4 pb-12"
          >
            {/* Opciones Izquierda */}
            <div className="flex flex-col gap-4 pointer-events-auto items-end md:items-start">
              <SmallOptionCard 
                icon={<Phone size={24} />} 
                title="Contactar asistente Marcos" 
                delay={0.2} 
                onClick={handleCallMarcos} 
              />
              <SmallOptionCard 
                icon={<Calendar size={24} />} 
                title="Ver agenda" 
                delay={0.3} 
                onClick={() => alert("Próximamente: Ver agenda")} 
              />
            </div>

            {/* Opciones Derecha */}
            <div className="flex flex-col gap-4 pointer-events-auto items-end md:items-start">
              <SmallOptionCard 
                icon={<Users size={24} />} 
                title="Ir a la junta de reunión" 
                delay={0.4} 
                onClick={handleMeetingRoom} 
              />
              <SmallOptionCard 
                icon={<ArrowLeft size={24} />} 
                title="Volver al Lobby" 
                delay={0.5} 
                onClick={handleBackToLobby} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* IMAGEN SALA DE JUNTAS */}
      <AnimatePresence>
        {step === 'meeting_room' && (
          <motion.div
            key={departmentInMeeting}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full z-20 bg-black"
          >
            <img
              src={
                departmentInMeeting === 'finance' 
                  ? "https://i.imgur.com/T3qsGmj.png" 
                  : departmentInMeeting === 'marketing'
                    ? "https://i.imgur.com/Acstmol.png"
                    : departmentInMeeting === 'strategy'
                      ? "https://i.imgur.com/an13Ing.png"
                      : "https://i.imgur.com/2hVGDiV.png"
              }
              alt="Sala de Juntas"
              className="absolute inset-0 w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
      </AnimatePresence>

            {/* INTERACCIÓN CON DEPARTAMENTO (CHAT GRUPAL) */}
      <AnimatePresence>
        {step === 'meeting_room' && departmentInMeeting !== 'none' && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 pointer-events-none"
          >
            {/* Indicador de quién está hablando */}
            <AnimatePresence>
              {activeSpeaker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className={`absolute z-50 pointer-events-none ${characterPositions[activeSpeaker] || 'top-1/2 left-1/2'}`}
                >
                  <TalkingIcon />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Panel de Chat */}
            <div className="absolute bottom-24 left-8 w-[400px] max-w-[90vw] max-h-[50vh] flex flex-col justify-end pointer-events-auto">
              <div 
                ref={chatScrollRef}
                className="overflow-y-auto flex flex-col gap-3 p-4 scrollbar-hide"
                style={{ scrollBehavior: 'smooth' }}
              >
                <AnimatePresence>
                  {departmentMessages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {msg.sender !== 'user' && (
                        <span className="text-xs text-white/70 ml-2 mb-1 font-medium">{msg.sender}</span>
                      )}
                      <div className={`px-4 py-2 rounded-2xl max-w-[85%] ${
                        msg.sender === 'user' 
                          ? 'bg-emerald-500/90 text-white rounded-br-sm' 
                          : 'bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-bl-sm'
                      }`}>
                        <p className="text-sm">{msg.text}</p>
                      </div>
                    </motion.div>
                  ))}
                  {isDepartmentTyping && !activeSpeaker && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex flex-col items-start"
                    >
                      <div className="px-4 py-3 rounded-2xl bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-bl-sm">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Input Area */}
            <div className="absolute bottom-8 left-8 w-[400px] max-w-[90vw] z-40 pointer-events-auto">
              <form onSubmit={handleSendDepartmentMessage} className="relative flex items-center">
                <input
                  type="text"
                  value={departmentInputText}
                  onChange={(e) => setDepartmentInputText(e.target.value)}
                  placeholder="Habla con el equipo..."
                  disabled={isDepartmentTyping}
                  className="w-full bg-black/50 border border-white/20 text-white placeholder:text-white/40 rounded-full py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all backdrop-blur-xl shadow-2xl"
                />
                <button
                  type="submit"
                  disabled={!departmentInputText.trim() || isDepartmentTyping}
                  className="absolute right-2 p-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-emerald-500"
                >
                  <Send size={18} className={isDepartmentTyping ? "opacity-50" : ""} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

{/* UI: OPCIONES DENTRO DE LA SALA DE JUNTAS */}
      <AnimatePresence>
        {step === 'meeting_room' && !isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex flex-col items-end justify-start p-6 md:p-12 z-30 pointer-events-none gap-4"
          >
            {/* Opciones Superior Derecha */}
            <div className="flex flex-col gap-4 pointer-events-auto items-end">
              <SmallOptionCard 
                icon={<ArrowLeft size={24} />} 
                title="Volver a la Oficina" 
                delay={0.2} 
                onClick={handleBackToOffice} 
              />
              {departmentInMeeting !== 'none' && (
                <SmallOptionCard 
                  icon={<X size={24} />} 
                  title="Terminar reunión" 
                  delay={0.3} 
                  onClick={() => {
                    setDepartmentInMeeting('none');
                  }} 
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TRANSICIÓN A NEGRO */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-black z-50 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OptionCard({ icon, title, delay, onClick }: { icon: ReactNode; title: string; delay: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl bg-black/40 border border-white/10 p-8 w-64 flex flex-col items-center justify-center gap-4 hover:bg-black/60 hover:border-white/30 transition-all duration-300 backdrop-blur-md"
    >
      <div className="text-emerald-400 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <span className="text-white font-medium tracking-widest uppercase text-sm">{title}</span>
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.button>
  );
}

function SmallOptionCard({ icon, title, delay, onClick }: { icon: ReactNode; title: string; delay: number; onClick: () => void }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.5, delay }}
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-black/60 border border-white/10 p-4 w-56 flex items-center gap-4 hover:bg-black/80 hover:border-white/30 transition-all duration-300 backdrop-blur-md text-left shadow-lg"
    >
      <div className="text-emerald-400 group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
        {icon}
      </div>
      <span className="text-white font-medium tracking-wider uppercase text-xs leading-tight">{title}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.button>
  );
}
