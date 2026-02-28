"use client"

import React from "react"

import { useEffect, useState } from "react"


import { Input } from "../../components/ui/input"
import { Label } from "../../components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../components/ui/card"
import { Shield, Loader2 } from "lucide-react"
import { Button } from "../../components/ui/button"
import { useNavigate } from "react-router-dom"
import { useLogin } from "../../hooks/connection/useLogin"
import { apiFetch } from "../../lib/api"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const {
    login,
    verifyTwoFactor,
    resendTwoFactor,
    resetTwoFactor,
    loading: isLoading,
    error,
    info,
    success,
    twoFactorRequired,
  } = useLogin()
  const [accessError, setAccessError] = useState("")

  const navigate = useNavigate()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccessError("")

    if (twoFactorRequired) {
      await verifyTwoFactor({ code: twoFactorCode })
      return
    }

    await login({ email, password })
  }

  useEffect(() => {
    if (!success) return

    let cancelled = false

    async function run() {
      try {
        const me = await apiFetch<{ privileges?: string }>("/api/auth/me")
        if (cancelled) return

        if (me?.privileges !== "admin") {
          localStorage.removeItem("token")
          localStorage.removeItem("sysgd_auth")
          setAccessError("Acceso denegado: solo administradores pueden ingresar.")
          return
        }

        navigate("/admin")
      } catch {
        localStorage.removeItem("token")
        localStorage.removeItem("sysgd_auth")
        if (!cancelled) setAccessError("No se pudo validar tu sesión.")
      }
    }

    run()
    return () => {
      cancelled = true
    }
  }, [success, navigate])

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center justify-center w-16 h-16 rounded-xl bg-primary mb-4">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">SYSGD</h1>
        </div>

        <Card className="border-border shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {twoFactorRequired ? "Verificación 2FA" : "Iniciar Sesión"}
            </CardTitle>
            <CardDescription>
              {twoFactorRequired
                ? "Ingresa el código enviado al correo del administrador"
                : "Ingrese sus credenciales para acceder al panel de administración"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {!twoFactorRequired ? (
                <>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="email">Correo electrónico</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@sysgd.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                    Código enviado para: <strong>{email}</strong>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="two-factor-code">Código de verificación</Label>
                    <Input
                      id="two-factor-code"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      placeholder="000000"
                      value={twoFactorCode}
                      onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      required
                    />
                  </div>
                </>
              )}
              {info && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <p className="text-sm text-primary">{info}</p>
                </div>
              )}
              {(error || accessError) && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive">{error}</p>
                  {accessError && (
                    <p className="text-sm text-destructive">{accessError}</p>
                  )}
                </div>
              )}
              <Button type="submit" className="w-full mt-2" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {twoFactorRequired ? "Verificando..." : "Iniciando sesión..."}
                  </>
                ) : (
                  twoFactorRequired ? "Verificar Código" : "Iniciar Sesión"
                )}
              </Button>
              {twoFactorRequired && (
                <>
                  <div className="h-px w-full bg-border" />
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setTwoFactorCode("")
                        resetTwoFactor()
                      }}
                      disabled={isLoading}
                    >
                      Volver
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={resendTwoFactor}
                      disabled={isLoading}
                    >
                      Reenviar código
                    </Button>
                  </div>
                </>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
