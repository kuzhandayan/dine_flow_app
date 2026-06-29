interface Props {
  senderName: string
  isAdmin: boolean
  isOwn: boolean
  content: string
  createdAt: Date
}

export function ChatMessageBubble({
  senderName,
  isAdmin,
  isOwn,
  content,
  createdAt,
}: Props): React.JSX.Element {
  const time = new Date(createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })

  if (isOwn) {
    return (
      <div className="flex flex-col items-end gap-0.5 mb-3">
        <div className="max-w-[75%] bg-[rgb(var(--df-accent))] text-white rounded-2xl rounded-br-sm px-4 py-2.5">
          <p className="text-[13px] leading-relaxed">{content}</p>
        </div>
        <span className="text-[10px] text-[rgb(var(--df-text-2))] mr-1">{time}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-start gap-0.5 mb-3">
      <div className="flex items-center gap-1.5 mb-0.5">
        {isAdmin ? (
          <span className="text-[10px] font-semibold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">
            Admin · DineFlow
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[rgb(var(--df-text-2))]">{senderName}</span>
        )}
      </div>
      <div className="max-w-[75%] bg-[rgb(var(--df-surface-2))] border border-[rgb(var(--df-border))] rounded-2xl rounded-tl-sm px-4 py-2.5">
        <p className="text-[13px] leading-relaxed">{content}</p>
      </div>
      <span className="text-[10px] text-[rgb(var(--df-text-2))] ml-1">{time}</span>
    </div>
  )
}
