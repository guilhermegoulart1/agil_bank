// Componente para renderizar README.md como Markdown formatado

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function MarkdownRenderer() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch('/README.md')
      .then((res) => {
        if (!res.ok) throw new Error('Falha ao carregar README');
        return res.text();
      })
      .then((text) => {
        setContent(text);
        setError(null);
      })
      .catch((err) => {
        console.error('Erro ao carregar README:', err);
        setError('Não foi possível carregar a documentação.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="markdown-loading">Carregando documentação...</div>;
  }

  if (error) {
    return <div className="markdown-error">{error}</div>;
  }

  return (
    <div className="markdown-container">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
}
