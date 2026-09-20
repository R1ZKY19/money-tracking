import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
export default function AssistantMessage({ message }) {
  if (!['user', 'assistant'].includes(message.role)) return null;
  const isUser = message.role === 'user';
  return <div className={isUser ? 'ml-8 rounded-xl bg-primary text-primary-foreground p-3' : 'mr-3 rounded-xl border border-border bg-card p-3'}>
    <p className="text-[10px] uppercase tracking-wider mb-2 opacity-70 flex items-center justify-between gap-2">
      <span>{isUser ? 'Anda' : 'Asisten AI'}</span>
      {(() => {
        const d = new Date(message.created_date || message.created_at || message.timestamp || NaN);
        return isNaN(d) ? null : <span className="normal-case tracking-normal">{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>;
      })()}
    </p>
    {message.content && <ReactMarkdown className="text-sm leading-relaxed break-words space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:overflow-x-auto" components={{ a: ({ href, children }) => href?.startsWith('/') && !href.startsWith('//') ? <Link to={href} className="underline font-medium">{children}</Link> : <a href={href} target="_blank" rel="noopener noreferrer" className="underline">{children}</a> }}>{message.content}</ReactMarkdown>}
    {message.tool_calls?.map((tool, i) => {
      const failed = ['failed', 'error'].includes(tool.status) || /error|failed/i.test(JSON.stringify(tool.results || '')) || tool.results?.success === false;
      const running = ['pending', 'running', 'in_progress'].includes(tool.status);
      const projection = tool.display_projection;
      const hidden = projection?.hide_details && projection?.details_redacted;
      const label = hidden ? (failed ? projection.error_label : running ? projection.active_label : projection.label) : failed ? 'Data belum berhasil dibaca' : running ? 'Memeriksa informasi…' : 'Informasi diperiksa';
      return <p key={i} className={failed ? 'text-xs text-destructive mt-2' : 'text-xs text-muted-foreground mt-2'}>{label || 'Memproses informasi'}</p>;
    })}
  </div>;
}