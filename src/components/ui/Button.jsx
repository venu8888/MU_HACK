const variants = {
  primary: 'bg-white text-black hover:bg-brand hover:text-black border-transparent',
  danger: 'border border-red-500 text-red-500 hover:bg-red-500 hover:text-white',
  success: 'border border-brand text-brand hover:bg-brand hover:text-black',
  outline: 'border border-white/40 text-white hover:border-white hover:bg-white/10',
  ghost: 'text-white/60 hover:text-white hover:bg-white/5',
};

const sizes = {
  sm: 'px-2 py-1 text-[10px] tracking-tighter',
  md: 'px-4 py-2 text-xs tracking-widest',
  lg: 'px-6 py-3 text-sm tracking-widest',
};

export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  icon: Icon,
  onClick,
  type = 'button',
  ...props 
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-bold uppercase 
        transition-all active:translate-y-[1px]
        disabled:opacity-20 disabled:cursor-not-allowed
        ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <div className="w-3 h-3 border-2 border-current border-t-transparent animate-spin" />
      ) : Icon ? (
        <Icon size={14} />
      ) : null}
      {children}
    </button>
  );
}
