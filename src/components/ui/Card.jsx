export default function Card({ children, className = '', hover = false, glow = '', onClick }) {
  return (
    <div 
      className={`glass-card ${hover ? 'glass-card-hover cursor-pointer' : ''} ${glow} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 border-b border-slate-700/30 ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return (
    <div className={`px-5 py-4 ${className}`}>
      {children}
    </div>
  );
}
