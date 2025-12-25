"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Volume2, Bell, MessageSquare } from "lucide-react"

interface ChatSettingsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChatSettings({ open, onOpenChange }: ChatSettingsProps) {
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [sendSoundEnabled, setSendSoundEnabled] = useState(true)
  const [receiveSoundEnabled, setReceiveSoundEnabled] = useState(true)
  const [volume, setVolume] = useState([80])
  const [notifications, setNotifications] = useState(true)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajustes de conversación</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Sound Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="sound-enabled" className="text-base">
                  Sonidos de mensajes
                </Label>
              </div>
              <Switch id="sound-enabled" checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>

            {soundEnabled && (
              <div className="ml-7 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="send-sound" className="text-sm">
                    Sonido al enviar
                  </Label>
                  <Switch id="send-sound" checked={sendSoundEnabled} onCheckedChange={setSendSoundEnabled} />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="receive-sound" className="text-sm">
                    Sonido al recibir
                  </Label>
                  <Switch id="receive-sound" checked={receiveSoundEnabled} onCheckedChange={setReceiveSoundEnabled} />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume" className="text-sm">
                    Volumen: {volume[0]}%
                  </Label>
                  <Slider id="volume" value={volume} onValueChange={setVolume} max={100} step={1} className="w-full" />
                </div>
              </div>
            )}
          </div>

          {/* Notification Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="notifications" className="text-base">
                Notificaciones
              </Label>
            </div>
            <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Message Settings */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <Label htmlFor="read-receipts" className="text-base">
                Confirmaciones de lectura
              </Label>
            </div>
            <Switch id="read-receipts" defaultChecked />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
