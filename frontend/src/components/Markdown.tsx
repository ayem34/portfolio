import ReactMarkdown from 'react-markdown';

/** Rendu des textes longs saisis dans l'admin (Markdown, sans HTML brut). */
export function Markdown({ children }: { children: string }) {
  if (!children.trim()) return null;
  return (
    <div className="prose-content">
      <ReactMarkdown
        components={{
          a: ({ href, children: content }) => {
            const external = /^https?:\/\//.test(href ?? '');
            return (
              <a
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {content}
              </a>
            );
          },
          img: ({ src, alt }) => <img src={src} alt={alt ?? ''} loading="lazy" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
