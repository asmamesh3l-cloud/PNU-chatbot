import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  BookOpen, 
  UserPlus, 
  Clock, 
  FileText, 
  Trash2, 
  MessageSquare,
  ChevronLeft,
  Settings,
  HelpCircle,
  Moon,
  Sun,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

/**
 * التطبيق الرئيسي لمساعد الدراسات العليا - جامعة الأميرة نورة بنت عبد الرحمن
 * مصمم لتقديم إجابات دقيقة بناءً على اللائحة المرفقة فقط.
 */
const App = () => {
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      content: 'مرحباً بكِ في المساعد الذكي لجامعة الأميرة نورة بنت عبد الرحمن. أنا هنا للإجابة على استفساراتكِ حصرياً بناءً على "اللائحة المنظمة للدراسات العليا وقواعدها التنفيذية بجامعة الأميرة نورة". كيف يمكنني خدمتكِ اليوم؟' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  // المتغيرات العالمية المطلوبة للبيئة
  const apiKey = ""; 
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'pnu-graduate-bot';
  
  // رابط الشعار المحدث من Google Drive
  const pnuLogo = "https://drive.google.com/uc?export=view&id=1xyWQeaftK_5nkxrn7BaWYOIxc9iCsUfI"; 

  // التمرير التلقائي لآخر رسالة
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // الأوامر السريعة المحدثة بناءً على طلب المستخدم
  const quickCommands = [
    { id: 'pnu_admission', label: 'شروط القبول', icon: <UserPlus className="w-4 h-4" />, prompt: 'ما هي شروط القبول العامة والخاصة في الدراسات العليا بجامعة الأميرة نورة بناءً على اللائحة المرفقة؟' },
    { id: 'pnu_duration', label: 'مدة الدراسة النظامية', icon: <Clock className="w-4 h-4" />, prompt: 'ما هي مدة الدراسة النظامية للماجستير والدكتوراه حسب القواعد التنفيذية لجامعة الأميرة نورة؟' },
    { id: 'pnu_thesis', label: 'تسجيل الرسالة', icon: <FileText className="w-4 h-4" />, prompt: 'اشرحي لي إجراءات تسجيل الرسالة العلمية حسب القواعد المذكورة في ملف جامعة الأميرة نورة.' },
    { id: 'pnu_defer', label: 'التأجيل والاعتذار', icon: <Trash2 className="w-4 h-4" />, prompt: 'ما هي ضوابط تأجيل الدراسة أو الاعتذار عنها في جامعة الأميرة نورة كما ورد في اللائحة؟' },
  ];

  const handleCommand = (prompt) => {
    handleSend(prompt);
  };

  const handleSend = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      let retryCount = 0;
      const maxRetries = 5;
      const delays = [1000, 2000, 4000, 8000, 16000];

      const callApi = async () => {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `السؤال: ${text}. 
            تعليمات صارمة للمساعد: يجب أن تستخدمي حصرياً ملف "اللائحة المنظمة للدراسات العليا في الجامعات وقواعدها التنفيذية بجامعة الأميرة نورة" كمصدر وحيد للمعلومات. 
            لا تقدمي أي معلومات عامة من خارج هذا المستند. 
            إذا كانت المعلومة غير موجودة في اللائحة المرفقة، قولي: "نعتذر، هذه المعلومة لم تذكر في اللائحة التنفيذية لجامعة الأميرة نورة المتوفرة لدي". 
            خاطبي المستخدمة بصيغة المؤنث دائماً.` }] }],
            systemInstruction: { parts: [{ text: "أنتِ المساعدة الذكية الرسمية لجامعة الأميرة نورة (PNU). دوركِ هو مساعدة الطالبات وأعضاء هيئة التدريس في فهم اللائحة التنفيذية للدراسات العليا. إجاباتكِ يجب أن تكون مهنية، دقيقة، ومنظمة في نقاط إذا لزم الأمر، مع ذكر أرقام المواد إن أمكن." }] }
          })
        });

        if (!response.ok) throw new Error('API Connection Error');
        return await response.json();
      };

      const executeWithRetry = async () => {
        try {
          return await callApi();
        } catch (err) {
          if (retryCount < maxRetries) {
            await new Promise(res => setTimeout(res, delays[retryCount]));
            retryCount++;
            return executeWithRetry();
          }
          throw err;
        }
      };

      const result = await executeWithRetry();
      const aiResponse = result.candidates?.[0]?.content?.parts?.[0]?.text || "نعتذر، لم نتمكن من الوصول للمعلومة المطلوبة في الوقت الحالي.";
      
      setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: "عذراً، حدث خطأ أثناء معالجة طلبكِ. يرجى التحقق من الاتصال بالإنترنت والمحاولة مرة أخرى." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`flex h-screen w-full ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-[#f4f9f4] text-slate-800'} font-sans`} dir="rtl">
      {/* القائمة الجانبية - Sidebar */}
      <aside className={`hidden md:flex flex-col w-80 border-l ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#daeada] bg-white shadow-lg shadow-emerald-900/5'} p-6`}>
        <div className="flex flex-col items-center gap-4 mb-10 text-center">
          <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-md bg-white p-2 border border-emerald-100 group transition-transform hover:scale-105">
             <img 
               src={pnuLogo} 
               alt="شعار جامعة الأميرة نورة" 
               className="w-full h-full object-contain" 
               onError={(e) => { e.target.src = "https://www.pnu.edu.sa/ar/PublishingImages/logo.png"; }}
             />
          </div>
          <div>
            <h1 className="font-bold text-lg text-[#006747] dark:text-emerald-400">جامعة الأميرة نورة</h1>
            <p className="text-xs text-emerald-700/60 dark:text-emerald-500/60 font-bold uppercase tracking-widest">عمادة الدراسات العليا</p>
          </div>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
          <div className="flex items-center gap-2 mb-4 px-2">
            <ShieldCheck className="w-4 h-4 text-[#006747]" />
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">محرك بحث اللائحة</p>
          </div>
          {quickCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => handleCommand(cmd.prompt)}
              className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all text-right border
                ${isDarkMode 
                  ? 'hover:bg-slate-700 border-slate-700 bg-slate-800/50' 
                  : 'hover:bg-emerald-50 border-[#daeada] bg-white shadow-sm'} group`}
            >
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-slate-700 text-emerald-400' : 'bg-emerald-50 text-[#006747]'} group-hover:bg-[#006747] group-hover:text-white transition-colors`}>
                {cmd.icon}
              </div>
              <span className="text-sm font-bold">{cmd.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-4 space-y-3">
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all border
              ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-slate-700' : 'border-[#daeada] bg-white hover:bg-gray-50'}`}
          >
            <div className="flex items-center gap-3">
              {isDarkMode ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-[#006747]" />}
              <span className="text-sm font-semibold">{isDarkMode ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
            </div>
          </button>
          <div className="p-4 bg-emerald-900 rounded-2xl border border-emerald-800 shadow-inner">
            <p className="text-[10px] leading-relaxed text-emerald-100 text-center font-medium opacity-80">
              مساعد ذكي حصري للطالبات والباحثات بجامعة الأميرة نورة بنت عبد الرحمن.
            </p>
          </div>
        </div>
      </aside>

      {/* منطقة المحادثة - Main Chat Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className={`px-6 py-4 border-b ${isDarkMode ? 'border-slate-700 bg-slate-800' : 'border-[#daeada] bg-white'} flex items-center justify-between shadow-sm z-10`}>
          <div className="flex items-center gap-3">
            <div className="md:hidden w-10 h-10 bg-white p-1 rounded-lg border border-emerald-100">
              <img src={pnuLogo} alt="Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="font-black text-[#006747] dark:text-emerald-400 tracking-tight">مساعد اللائحة التنفيذية الذكي</h2>
              <p className="text-[10px] text-emerald-600/50 font-bold">بيانات مستخرجة من اللائحة المرفقة فقط</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <div className="hidden sm:flex items-center gap-2 bg-[#006747]/10 px-3 py-1.5 rounded-full border border-[#006747]/20">
                <AlertCircle size={14} className="text-[#006747]" />
                <span className="text-[11px] font-black text-[#006747] uppercase">دليل استرشادي</span>
             </div>
          </div>
        </header>

        {/* الرسائل - Messages List */}
        <div className={`flex-1 overflow-y-auto p-4 md:p-10 space-y-8 ${isDarkMode ? 'bg-slate-900' : 'bg-[#f4f9f4]'} no-scrollbar`}>
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end animate-in fade-in slide-in-from-bottom-2'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-sm relative group
                ${msg.role === 'user' 
                  ? (isDarkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-[#daeada]') 
                  : 'bg-white border-2 border-[#006747] text-slate-800 shadow-xl shadow-emerald-900/5'
                }`}>
                
                <div className="flex items-center justify-between mb-3 border-b border-gray-50 pb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded-md ${msg.role === 'assistant' ? 'bg-[#006747] text-white' : 'bg-gray-200 text-gray-600'}`}>
                      {msg.role === 'assistant' ? <ShieldCheck size={12} /> : <UserPlus size={12} />}
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                      {msg.role === 'assistant' ? 'مساعد جامعة نورة' : 'الباحثة'}
                    </span>
                  </div>
                  <span className="text-[9px] opacity-40 font-bold">
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className={`text-sm md:text-base leading-[1.8] whitespace-pre-wrap font-medium
                  ${msg.role === 'assistant' ? 'text-slate-800' : 'text-slate-600'}`}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end animate-pulse">
              <div className="bg-[#006747] text-white rounded-3xl p-5 shadow-lg flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
                <span className="text-xs font-bold">جاري مراجعة بنود اللائحة...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Mobile Quick Actions - تظهر فقط في الشاشات الصغيرة */}
        <div className="md:hidden flex overflow-x-auto gap-2 px-4 py-3 bg-white border-t border-gray-100 no-scrollbar">
          {quickCommands.map((cmd) => (
            <button
              key={cmd.id}
              onClick={() => handleCommand(cmd.prompt)}
              className="whitespace-nowrap px-4 py-2 rounded-full bg-[#006747]/10 text-[#006747] border border-[#006747]/20 text-[10px] font-black"
            >
              {cmd.label}
            </button>
          ))}
        </div>

        {/* منطقة الإدخال - Input Section */}
        <div className={`p-4 md:p-6 ${isDarkMode ? 'bg-slate-800 border-t border-slate-700' : 'bg-white border-t border-[#daeada]'}`}>
          <div className="max-w-4xl mx-auto flex items-center gap-4">
            <div className="relative flex-1 group">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="اسألي عن شروط القبول، المواد، أو الأنظمة الدراسية..."
                className={`w-full py-5 pr-5 pl-14 rounded-[2rem] border-2 transition-all outline-none text-sm md:text-base font-bold
                  ${isDarkMode 
                    ? 'bg-slate-900 border-slate-700 text-white focus:border-emerald-500' 
                    : 'bg-[#fcfdfc] border-[#daeada] text-slate-800 focus:border-[#006747] focus:bg-white shadow-inner'}`}
              />
              <button 
                onClick={() => handleSend()}
                disabled={loading || !input.trim()}
                className={`absolute left-3 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all shadow-lg
                  ${loading || !input.trim() 
                    ? 'bg-gray-300 text-white cursor-not-allowed' 
                    : 'bg-[#006747] hover:bg-[#004d35] text-white hover:scale-105 active:scale-95'}`}
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </div>
          <p className="text-center text-[9px] text-emerald-900/40 mt-3 font-bold uppercase tracking-widest">
             جميع الحقوق محفوظة - جامعة الأميرة نورة بنت عبد الرحمن © 2024
          </p>
        </div>
      </main>

      {/* CSS التنسيقات الإضافية */}
      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @font-face {
          font-family: 'Tajawal';
          src: url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
        }
        body { font-family: 'Tajawal', sans-serif; overflow: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #00674733; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #00674755; }
        input::placeholder { font-weight: 500; opacity: 0.6; }
      `}} />
    </div>
  );
};

export default App;
