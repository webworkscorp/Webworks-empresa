const fs = require('fs');

const content = fs.readFileSync('src/App.tsx', 'utf8');

const startIndex = content.indexOf('{/* INTERACCIÓN CON RICARDO, JAVIER Y JULIO EN SALA DE JUNTAS */}');
const endIndex = content.indexOf('{/* UI: OPCIONES DENTRO DE LA SALA DE JUNTAS */}');

if (startIndex !== -1 && endIndex !== -1) {
  const newContent = content.substring(0, startIndex) + `      {/* INTERACCIÓN CON DEPARTAMENTO (CHAT GRUPAL) */}
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
                  className={\`absolute z-50 pointer-events-none \${characterPositions[activeSpeaker] || 'top-1/2 left-1/2'}\`}
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
                      className={\`flex flex-col \${msg.sender === 'user' ? 'items-end' : 'items-start'}\`}
                    >
                      {msg.sender !== 'user' && (
                        <span className="text-xs text-white/70 ml-2 mb-1 font-medium">{msg.sender}</span>
                      )}
                      <div className={\`px-4 py-2 rounded-2xl max-w-[85%] \${
                        msg.sender === 'user' 
                          ? 'bg-emerald-500/90 text-white rounded-br-sm' 
                          : 'bg-black/60 backdrop-blur-md text-white border border-white/10 rounded-bl-sm'
                      }\`}>
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

` + content.substring(endIndex);

  fs.writeFileSync('src/App.tsx', newContent, 'utf8');
  console.log('Successfully replaced content.');
} else {
  console.log('Could not find start or end index.');
}
