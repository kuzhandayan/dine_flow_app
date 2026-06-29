interface UnreadDotProps {
  count?: number
}

export function UnreadDot({ count }: UnreadDotProps): React.JSX.Element {
  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
      {count && count > 9 ? '9+' : count}
    </span>
  )
}
