"use client";

import dynamic from "next/dynamic";
import { useRef, useCallback } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-900 text-gray-400 rounded-lg">
      Loading editor...
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  theme?: string;
  readOnly?: boolean;
  height?: string;
  onRun?: () => void;
  onSubmit?: () => void;
}

// Map our language keys to Monaco language IDs
const MONACO_LANG_MAP: Record<string, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
  c: "c",
  cpp: "cpp",
  go: "go",
};

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  theme = "vs-dark",
  readOnly = false,
  height = "400px",
  onRun,
  onSubmit,
}: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = useCallback(
    (editor: any, monaco: any) => {
      editorRef.current = editor;

      // Add keyboard shortcuts
      if (onRun) {
        editor.addAction({
          id: "run-code",
          label: "Run Code",
          keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
          run: () => onRun(),
        });
      }

      if (onSubmit) {
        editor.addAction({
          id: "submit-code",
          label: "Submit Code",
          keybindings: [
            monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter,
          ],
          run: () => onSubmit(),
        });
      }
    },
    [onRun, onSubmit]
  );

  const monacoLanguage = MONACO_LANG_MAP[language] || "javascript";

  return (
    <div className="rounded-lg overflow-hidden border border-gray-700 h-full">
      <MonacoEditor
        height={height}
        language={monacoLanguage}
        value={value}
        theme={theme}
        onChange={(v) => onChange(v || "")}
        onMount={handleEditorDidMount}
        options={{
          readOnly,
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          padding: { top: 10 },
          suggestOnTriggerCharacters: true,
          quickSuggestions: true,
          folding: true,
          renderLineHighlight: "all",
        }}
      />
    </div>
  );
}
