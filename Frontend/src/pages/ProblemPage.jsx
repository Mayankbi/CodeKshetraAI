import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams, useNavigate } from 'react-router';
import { useDispatch, useSelector } from 'react-redux';
import { updateUserScore } from '../authSlice';
import axiosClient from "../utils/axiosClient"
import SubmissionHistory from "../components/SubmissionHistory"
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CheckCircle2, XCircle, Clock, Database, Terminal, PlayCircle, BookOpen, Lightbulb, History, Sparkles, FileText, Code2, Lock, Rocket } from 'lucide-react';




const langMap = {
  cpp: 'C++',           //capital letter m iss liye kyuki backend se ye 1st letter capital aa rha h 
  java: 'Java',
  javascript: 'JavaScript'
};


const ProblemPage = () => {
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const { user } = useSelector((state) => state.auth);
  const editorRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let { problemId } = useParams();

  // Unused icons destructuring removed: ChevronRight, AlertCircle

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);

        // Let the second useEffect handle setting the initial code.
        setProblem(response.data);
        setLoading(false);

      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

  // Update code when language changes or problem loads
  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode?.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
      setCode(initialCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLanguage, problem]);

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    setActiveRightTab('testcase');

    try {
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);

    } catch (error) {
      console.error('Error running code:', error);

      // If the backend sent a structured response with error details (e.g. compilation error)
      if (error.response && error.response.data) {
        setRunResult(error.response.data);
      } else {
        // Fallback for network issues or complete server failures
        setRunResult({
          success: false,
          error: 'Network error or internal server error while reaching judge API.'
        });
      }

      setLoading(false);
    }
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    setActiveRightTab('result');

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });

      if (response.data?.newScore !== undefined) {
        dispatch(updateUserScore({ newScore: response.data.newScore }));
      }

      setSubmitResult(response.data);
      setLoading(false);

    } catch (error) {
      console.error('Error submitting code:', error);

      if (error.response && error.response.data) {
        setSubmitResult(error.response.data);
      } else {
        setSubmitResult({
          accepted: false,
          error: 'Network error or internal server error while reaching judge API.'
        });
      }

      setLoading(false);
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  if (loading && !problem) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-void">
        <span className="loading loading-spinner text-accent loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-void text-body text-text-2 overflow-hidden">
      {/* Premium Navbar */}
      <nav className="h-14 bg-void/90 backdrop-blur-md border-b border-border flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-text-1 font-bold shadow-[0_0_12px_var(--accent-glow)] cursor-pointer" onClick={() => navigate('/')}>
            C
          </div>
          <h1 className="text-h3 text-text-1 truncate max-w-[200px] md:max-w-md">
            {problem?.title || 'Loading Problem...'}
          </h1>
          {problem && (
            <div className={`badge-luxury ${problem.difficulty?.toLowerCase() === 'easy' ? 'badge-easy' :
              problem.difficulty?.toLowerCase() === 'medium' ? 'badge-medium' :
                'badge-hard'
              }`}>
              {problem.difficulty}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <select
            className="input-luxury text-small font-medium"
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="javascript">JavaScript (Node.js)</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
        </div>
      </nav>

      {/* Main Split Interface */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2">
        {/* Left Panel - Context */}
        <div className="w-1/2 flex flex-col bg-surface rounded-[14px] shadow-sm border border-border overflow-hidden relative">

          {/* Subtle abstract background */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent-glow blur-3xl rounded-full pointer-events-none"></div>

          {/* Left Tabs */}
          <div className="flex border-b border-border bg-surface z-10 shrink-0">
            {[
              { id: 'description', label: 'Description', icon: FileText },
              { id: 'editorial', label: 'Editorial', icon: BookOpen },
              { id: 'solutions', label: 'Solutions', icon: Lightbulb },
              { id: 'submissions', label: 'Submissions', icon: History },
              { id: 'chatAI', label: 'AI Tutor', icon: Sparkles, color: 'text-accent' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeLeftTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold transition-all relative outline-none ${isActive ? 'text-text-1 bg-elevated' : 'text-text-3 hover:text-text-1 hover:bg-muted-surface'}`}
                  onClick={() => setActiveLeftTab(tab.id)}
                >
                  <Icon size={16} className={tab.color || (isActive ? 'text-text-1' : 'opacity-70')} />
                  {tab.label}
                  {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_-2px_8px_var(--accent-glow)]"></div>}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar z-10 relative">
            {problem && (
              <div className="h-full min-h-full">
                {activeLeftTab === 'description' && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-none text-text-2">
                    <div className="flex items-center gap-3 mb-6">
                      <h2 className="text-h1 m-0">{problem.title}</h2>
                    </div>

                    <div className="flex gap-2 mb-8 border-b border-border pb-6">
                      <div className={`badge-luxury ${problem.difficulty?.toLowerCase() === 'easy' ? 'badge-easy' :
                        problem.difficulty?.toLowerCase() === 'medium' ? 'badge-medium' :
                          'badge-hard'
                        }`}>
                        {problem.difficulty}
                      </div>
                      <div className="px-2.5 py-1 rounded-[5px] bg-muted-surface text-text-3 border border-border text-[11px] font-bold uppercase tracking-wider">
                        {problem.tags || 'Topic'}
                      </div>
                    </div>

                    <div className="text-body text-text-2 mb-10">
                      <div className="whitespace-pre-wrap font-medium">
                        {problem.description}
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h3 className="text-h2 border-b border-border pb-2 mb-4 flex items-center gap-2">
                        <Code2 size={20} className="text-accent" /> Test Examples
                      </h3>
                      <div className="space-y-6">
                        {problem.visibleTestCases.map((example, index) => (
                          <div key={index} className="bg-muted-surface rounded-[10px] border border-border overflow-hidden shadow-sm">
                            <div className="bg-void px-4 py-2 border-b border-border font-bold text-sm tracking-wide text-text-2">
                              Example {index + 1}
                            </div>
                            <div className="p-4 space-y-3 font-mono text-small">
                              <div>
                                <span className="font-bold text-text-3 uppercase tracking-widest text-[11px] block mb-1">Input</span>
                                <div className="text-text-1 bg-void p-2.5 rounded-lg border border-border whitespace-pre-wrap">{example.input}</div>
                              </div>
                              <div>
                                <span className="font-bold text-text-3 uppercase tracking-widest text-[11px] block mb-1">Output</span>
                                <div className="text-text-1 font-bold bg-void p-2.5 rounded-lg border border-border whitespace-pre-wrap">{example.output}</div>
                              </div>
                              {example.explanation && (
                                <div>
                                  <span className="font-bold text-text-3 uppercase tracking-widest text-[11px] block mb-1">Explanation</span>
                                  <div className="text-text-2 font-sans italic bg-void p-2.5 rounded-lg border border-border">{example.explanation}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeLeftTab === 'editorial' && (
                  <div className="animate-in fade-in duration-500 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                      <BookOpen className="text-accent" size={24} />
                      <h2 className="text-h2">Editorial & Video Solution</h2>
                    </div>
                    <div className="flex-1 bg-muted-surface rounded-[14px] border border-border p-4 shadow-inner">
                      <Editorial title={problem.title} secureUrl={problem.secureUrl} thumbnailUrl={problem.thumbnailUrl} duration={problem.duration} />
                    </div>
                  </div>
                )}

                {activeLeftTab === 'solutions' && (
                  <div className="animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                      <Lightbulb className="text-warning" size={24} />
                      <h2 className="text-h2">Community Solutions</h2>
                    </div>

                    <div className="space-y-8">
                      {problem.referenceSolution && problem.referenceSolution.length > 0 ? problem.referenceSolution.map((solution, index) => (
                        <div key={index} className="card-luxury overflow-hidden">
                          <div className="bg-muted-surface px-5 py-3 border-b border-border flex justify-between items-center">
                            <span className="font-bold tracking-tight text-text-1">{problem?.title} Solution</span>
                            <span className="px-2.5 py-1 bg-accent-glow text-accent-light rounded-md text-xs font-black uppercase tracking-wider border border-border-bright">
                              {solution?.language || 'Code'}
                            </span>
                          </div>
                          <div className="p-0 bg-[#0d0d0d]">
                            <SyntaxHighlighter
                              language={solution?.language?.toLowerCase() === 'c++' ? 'cpp' : solution?.language?.toLowerCase() || 'javascript'}
                              style={vscDarkPlus}
                              customStyle={{ background: 'transparent', margin: 0, padding: '1.25rem', fontSize: '14px' }}
                            >
                              {solution?.completeCode}
                            </SyntaxHighlighter>
                          </div>
                        </div>
                      )) : (
                        <div className="bg-muted-surface border border-border border-dashed rounded-[14px] p-10 text-center flex flex-col items-center gap-4">
                          <div className="w-16 h-16 rounded-full bg-void flex items-center justify-center">
                            <Lock size={24} className="text-text-3" />
                          </div>
                          <div>
                            <h3 className="text-h3 mb-1">Solutions Locked</h3>
                            <p className="text-body text-text-3 max-w-sm">Detailed reference solutions will become available once you successfully solve this problem.</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeLeftTab === 'submissions' && (
                  <div className="animate-in fade-in duration-500 h-full flex flex-col">
                    <div className="flex items-center gap-2 mb-6 border-b border-border pb-4">
                      <History className="text-accent" size={24} />
                      <h2 className="text-h2">Submission History</h2>
                    </div>
                    <div className="flex-1 card-luxury overflow-hidden">
                      <SubmissionHistory problemId={problemId} />
                    </div>
                  </div>
                )}

                {activeLeftTab === 'chatAI' && (
                  <div className="animate-in fade-in duration-500 h-full flex flex-col">
                    <div className="flex-1">
                      <ChatAi problem={problem}></ChatAi>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Workspace */}
        <div className="w-1/2 flex flex-col bg-surface rounded-[14px] shadow-sm border border-border overflow-hidden">

          {/* Right Tabs */}
          <div className="flex border-b border-border bg-surface shrink-0">
            <button
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all relative outline-none ${activeRightTab === 'code' ? 'text-text-1 bg-elevated' : 'text-text-3 hover:text-text-1 hover:bg-muted-surface'}`}
              onClick={() => setActiveRightTab('code')}
            >
              <Code2 size={16} className={activeRightTab === 'code' ? 'text-accent' : 'opacity-70'} /> Code Editor
              {activeRightTab === 'code' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent shadow-[0_-2px_8px_var(--accent-glow)]"></div>}
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all relative outline-none ${activeRightTab === 'testcase' ? 'text-text-1 bg-elevated' : 'text-text-3 hover:text-text-1 hover:bg-muted-surface'}`}
              onClick={() => setActiveRightTab('testcase')}
            >
              <Terminal size={16} className={activeRightTab === 'testcase' ? 'text-cyan' : 'opacity-70'} /> Test Console
              {activeRightTab === 'testcase' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan shadow-[0_-2px_8px_var(--cyan-soft)]"></div>}
            </button>
            <button
              className={`flex items-center gap-2 px-6 py-3 text-sm font-semibold transition-all relative outline-none ${activeRightTab === 'result' ? 'text-success bg-success-bg/30' : 'text-text-3 hover:text-text-1 hover:bg-muted-surface'}`}
              onClick={() => setActiveRightTab('result')}
            >
              <PlayCircle size={16} className={activeRightTab === 'result' ? 'text-success' : 'opacity-70'} /> Result
              {activeRightTab === 'result' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-success shadow-[0_-2px_8px_rgba(16,185,129,0.3)]"></div>}
            </button>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-void">
            <div className="flex-1 flex flex-col min-h-0">
              {activeRightTab === 'code' && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Language Selector */}
                  <div className="flex justify-between items-center p-4 border-b border-border bg-surface">
                    <div className="flex gap-2">
                      {['javascript', 'java', 'cpp'].map((lang) => (
                        <button
                          key={lang}
                          className={selectedLanguage === lang ? 'btn-luxury py-1 px-3 text-sm' : 'btn-luxury-secondary border-transparent py-1 px-3 text-sm'}
                          onClick={() => handleLanguageChange(lang)}
                        >
                          {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monaco Editor */}
                  <div className="flex-1 min-h-0">
                    <Editor
                      height="100%"
                      language={getLanguageForMonaco(selectedLanguage)}
                      value={code}
                      onChange={handleEditorChange}
                      onMount={handleEditorDidMount}
                      theme="vs-dark"
                      options={{
                        fontSize: 14,
                        fontFamily: 'JetBrains Mono',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: 'line',
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: 'line',
                        mouseWheelZoom: true,
                      }}
                    />
                  </div>
                </div>
              )}

              {activeRightTab === 'testcase' && (
                <div className="flex-1 p-6 overflow-y-auto bg-surface custom-scrollbar">
                  <div className="flex items-center gap-2 mb-6 text-text-1">
                    <Terminal size={20} className="text-cyan" />
                    <h3 className="font-bold text-lg tracking-tight">Console Outputs</h3>
                  </div>

                  {loading && !runResult ? (
                    <div className="flex flex-col items-center justify-center h-[60%] text-text-3 space-y-4 animate-in fade-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-cyan-soft/20 flex flex-col items-center justify-center border border-cyan/30 shadow-[0_0_15px_var(--cyan-soft)]">
                        <span className="loading loading-spinner text-cyan"></span>
                      </div>
                      <h4 className="text-h3 text-text-1">Running Test Cases...</h4>
                      <p className="text-small text-center max-w-xs opacity-70">Executing against example test cases. This may take a moment.</p>
                    </div>
                  ) : runResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {/* Status Header Card */}
                      <div className={`p-4 rounded-[14px] border ${runResult.success ? 'bg-success-bg/30 border-success-border' : 'bg-danger-bg/30 border-danger-border'} mb-6 flex items-center justify-between shadow-sm`}>
                        <div className="flex items-center gap-3">
                          {runResult.success ? (
                            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0">
                              <CheckCircle2 size={24} />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-danger/20 flex items-center justify-center text-danger shrink-0">
                              <XCircle size={24} />
                            </div>
                          )}
                          <div>
                            <h4 className={`font-bold text-lg ${runResult.success ? 'text-success' : 'text-danger'}`}>
                              {runResult.success ? 'Accepted' : 'Wrong Answer'}
                            </h4>
                            <p className="text-xs text-text-3 mt-0.5 font-medium">All example test cases completed</p>
                          </div>
                        </div>

                        {runResult.success && (
                          <div className="flex gap-4">
                            <div className="flex items-center gap-1.5 bg-muted-surface px-3 py-1.5 rounded-lg border border-border shadow-sm text-text-1">
                              <Clock size={14} className="text-text-3" />
                              <span className="text-sm font-mono font-medium">{runResult.runtime}s</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-muted-surface px-3 py-1.5 rounded-lg border border-border shadow-sm text-text-1">
                              <Database size={14} className="text-text-3" />
                              <span className="text-sm font-mono font-medium">{runResult.memory} KB</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Test Cases List */}
                      <div className="space-y-4">
                        {runResult.testCases && runResult.testCases.length > 0 ? (
                          runResult.testCases.map((tc, i) => {
                            const isSuccess = tc.status_id === 3;
                            return (
                              <div key={i} className={`bg-muted-surface border rounded-[14px] overflow-hidden transition-all ${isSuccess ? 'border-border hover:border-border-bright' : 'border-danger-border bg-danger-bg/30'}`}>
                                <div className={`px-4 py-2 border-b text-sm font-bold flex justify-between items-center ${isSuccess ? 'border-border bg-surface' : 'border-danger-border bg-danger-bg text-danger'}`}>
                                  <span>Case {i + 1}</span>
                                  <div className={`badge-luxury ${isSuccess ? 'badge-easy' : 'badge-hard'}`}>
                                    {isSuccess ? 'Passed' : 'Failed'}
                                  </div>
                                </div>
                                <div className="p-4 space-y-4 text-small">
                                  <div>
                                    <div className="text-[11px] text-text-3 font-bold uppercase tracking-[0.06em] mb-1.5">Input</div>
                                    <div className="bg-void p-2.5 rounded-lg font-mono text-text-1 whitespace-pre-wrap text-[13px] border border-border">
                                      {tc.stdin}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <div className="text-[11px] text-text-3 font-bold uppercase tracking-[0.06em] mb-1.5">Output</div>
                                      <div className={`bg-void p-2.5 rounded-lg font-mono whitespace-pre-wrap text-[13px] border ${!isSuccess ? 'border-danger-border text-danger bg-danger-bg' : 'border-border text-text-1'}`}>
                                        {tc.stdout || ' '}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-[11px] text-text-3 font-bold uppercase tracking-[0.06em] mb-1.5">Expected</div>
                                      <div className="bg-void p-2.5 rounded-lg font-mono text-text-2 whitespace-pre-wrap text-[13px] border border-border">
                                        {tc.expected_output}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        ) : (
                          <div className="bg-danger-bg/30 border border-danger-border p-4 rounded-[14px] font-mono text-sm text-danger whitespace-pre-wrap">
                            {typeof runResult.error === 'object' ? JSON.stringify(runResult.error, null, 2) : (runResult.error || "Execution failed or timed out.")}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[60%] text-text-3 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted-surface flex items-center justify-center border border-border">
                        <Terminal size={32} className="opacity-50" />
                      </div>
                      <p className="text-body text-center max-w-xs">Click "Run" to test your code with the example test cases.</p>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'result' && (
                <div className="flex-1 p-6 overflow-y-auto bg-surface custom-scrollbar">
                  <div className="flex items-center gap-2 mb-6 text-text-1">
                    <PlayCircle size={20} className="text-success" />
                    <h3 className="font-bold text-lg tracking-tight">Submission Result</h3>
                  </div>

                  {loading && !submitResult ? (
                    <div className="flex flex-col items-center justify-center h-[60%] text-text-3 space-y-4 animate-in fade-in duration-300">
                      <div className="w-16 h-16 rounded-full bg-success-bg/30 flex flex-col items-center justify-center border border-success-border shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                        <span className="loading loading-spinner text-success"></span>
                      </div>
                      <h4 className="text-h3 text-text-1">Evaluating Submission...</h4>
                      <p className="text-small text-center max-w-xs opacity-70">Running your code against hidden test cases to verify correctness.</p>
                    </div>
                  ) : submitResult ? (
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className={`p-6 rounded-[14px] border ${submitResult.accepted ? 'bg-success-bg/30 border-success-border shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'bg-danger-bg/30 border-danger-border shadow-[0_0_15px_rgba(239,68,68,0.1)]'} shadow-lg mb-6`}>
                        <div className="flex items-start gap-4">
                          {submitResult.accepted ? (
                            <div className="w-12 h-12 rounded-full bg-success/20 flex items-center justify-center text-success shrink-0 mt-1">
                              <CheckCircle2 size={28} />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-danger/20 flex items-center justify-center text-danger shrink-0 mt-1">
                              <XCircle size={28} />
                            </div>
                          )}

                          <div className="flex-1">
                            <h4 className={`text-h1 ${submitResult.accepted ? 'text-success' : 'text-danger'}`}>
                              {submitResult.accepted ? 'Accepted!' : (typeof submitResult.error === 'object' ? JSON.stringify(submitResult.error) : (submitResult.error || 'Wrong Answer'))}
                            </h4>

                            {submitResult.error && !submitResult.accepted && typeof submitResult.error === 'string' && submitResult.error.length > 30 && (
                              <div className="mt-4 bg-danger-bg/30 border border-danger-border p-4 rounded-[14px] font-mono text-sm text-danger whitespace-pre-wrap">
                                {submitResult.error}
                              </div>
                            )}

                            {submitResult.pointsAwarded !== undefined && submitResult.pointsAwarded > 0 && (
                              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/30 rounded-[10px] text-yellow-500 font-bold">
                                <Sparkles size={18} />
                                <span>You earned +{submitResult.pointsAwarded} points for solving this problem!</span>
                              </div>
                            )}

                            {submitResult.passedTestCases !== undefined && (
                              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="card-luxury p-4 flex flex-col justify-center items-center">
                                  <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-1">Test Cases</span>
                                  <div className="flex items-baseline gap-1">
                                    <span className={`text-xl font-bold ${submitResult.passedTestCases === submitResult.totalTestCases ? 'text-success' : 'text-danger'}`}>
                                      {submitResult.passedTestCases}
                                    </span>
                                    <span className="text-sm font-medium text-text-3">/ {submitResult.totalTestCases}</span>
                                  </div>
                                </div>

                                {submitResult.runtime !== undefined && (
                                  <div className="card-luxury p-4 flex flex-col justify-center items-center">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-1">Runtime</span>
                                    <div className="flex items-center gap-2">
                                      <Clock size={16} className="text-accent/70" />
                                      <span className="text-lg font-bold font-mono text-text-1">{submitResult.runtime}s</span>
                                    </div>
                                  </div>
                                )}

                                {submitResult.memory !== undefined && (
                                  <div className="card-luxury p-4 flex flex-col justify-center items-center">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-3 mb-1">Memory</span>
                                    <div className="flex items-center gap-2">
                                      <Database size={16} className="text-cyan/70" />
                                      <span className="text-lg font-bold font-mono text-text-1">{submitResult.memory} KB</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-[60%] text-text-3 space-y-4">
                      <div className="w-16 h-16 rounded-full bg-muted-surface flex items-center justify-center border border-border">
                        <PlayCircle size={32} className="opacity-50" />
                      </div>
                      <p className="text-body text-center max-w-xs">Submit your code to see the final evaluation metrics.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-border bg-surface flex justify-between shrink-0">
              <div className="flex gap-2">
                <button
                  className="btn-luxury-secondary"
                  onClick={() => setActiveRightTab('testcase')}
                >
                  Console
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  className="btn-luxury-secondary"
                  onClick={handleRun}
                  disabled={loading}
                >
                  {loading && activeRightTab === 'testcase' ? <span className="loading loading-spinner loading-xs"></span> : <PlayCircle size={16} />} Run
                </button>
                <button
                  className="btn-luxury bg-success text-success-bg hover:bg-[#0ea5e9] hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]"
                  onClick={handleSubmitCode}
                  disabled={loading}
                >
                  {loading && activeRightTab === 'result' ? <span className="loading loading-spinner loading-xs"></span> : <Rocket size={16} />} Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;