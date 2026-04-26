export default function Card({ children, className = '', hover = false, onClick }) {
  return (
    <div 
      className={`glass-card ${hover ? 'glass-card-hover cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-4 py-3 border-b border-white/10 ${className}`}>
      <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1 flex items-center gap-2">
        <div className="w-1 h-1 bg-brand" />
        Component Header
      </div>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-4 py-4 ${className}`}>
      {children}
    </div>
  );
}
