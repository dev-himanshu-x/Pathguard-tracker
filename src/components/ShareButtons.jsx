import { Mail, MessageCircle, MessageSquare, Phone } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { telLink } from '@/lib/share'
import { toast } from '@/lib/toast'
import { CHANNEL_LABEL, notifyGuardians, summarize } from '@/services/mail'

const ICON = { whatsapp: MessageCircle, sms: MessageSquare, email: Mail }

// One tap sends the message straight from the server; no app or compose window opens.
export default function ShareButtons({ contact, type, data, call = false, size = 'sm' }) {
  const [busy, setBusy] = useState(null)
  const send = async (channel) => {
    setBusy(channel)
    const { results, error } = await notifyGuardians({
      type,
      contacts: [contact],
      channels: [channel],
      data,
    })
    setBusy(null)
    const { sent, failed, skipped } = summarize(results)
    if (sent.length)
      toast.success(`${CHANNEL_LABEL[channel]} sent to ${contact.name}`, {
        description: sent[0].previewUrl ? `Test inbox: ${sent[0].previewUrl}` : undefined,
      })
    else
      toast.error(`${CHANNEL_LABEL[channel]} not sent`, {
        description: error || failed[0]?.reason || skipped[0]?.reason || 'Something went wrong.',
      })
  }
  return (
    <div className="flex flex-wrap gap-2">
      {['whatsapp', 'sms', 'email'].map((ch) => {
        const Icon = ICON[ch]
        return (
          <Button
            key={ch}
            type="button"
            size={size}
            variant="outline"
            disabled={busy !== null || (ch === 'email' && !contact.email)}
            onClick={() => send(ch)}
          >
            <Icon /> {busy === ch ? 'Sending…' : CHANNEL_LABEL[ch]}
          </Button>
        )
      })}
      {call && (
        <Button asChild size={size} variant="outline">
          <a href={telLink(contact.phone)}>
            <Phone /> Call
          </a>
        </Button>
      )}
    </div>
  )
}
