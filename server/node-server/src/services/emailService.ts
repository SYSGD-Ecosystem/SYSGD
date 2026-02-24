// src/services/emailService.ts
/** biome-ignore-all lint/complexity/noStaticOnlyClass: <explanation> */
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Email del remitente (será noreply@resend.dev en plan gratuito)
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const APP_NAME = process.env.APP_NAME || 'SYSGD';
const APP_URL = process.env.APP_URL || 'http://localhost:5173';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'lazaroyunier96@gmail.com';
const EMAIL_INTERCEPT_ENABLED =
  process.env.EMAIL_INTERCEPT_ENABLED === 'true' ||
  (process.env.NODE_ENV !== 'production' && process.env.EMAIL_INTERCEPT_ENABLED !== 'false');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  /**
   * Determina el tipo de email basado en el subject
   */
  private static getEmailType(subject: string): string {
    if (subject.includes('Verifica tu email')) return '✉️ Verificación de Email';
    if (subject.includes('Restablece tu contraseña')) return '🔑 Recuperación de Contraseña';
    if (subject.includes('invitó a colaborar')) return '👥 Invitación a Proyecto';
    if (subject.includes('Nueva tarea')) return '✅ Asignación de Tarea';
    if (subject.includes('Bienvenido')) return '🎉 Email de Bienvenida';
    return '📬 Notificación General';
  }

  
  /**
   * Envía un email genérico
   */
  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const shouldIntercept = EMAIL_INTERCEPT_ENABLED;
      const subject = shouldIntercept
        ? `[Para: ${options.to}] ${options.subject}`
        : options.subject;
      const html = shouldIntercept
        ? `
          <div style="background: #1e3a8a; color: white; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px 0; color: white;">Notificacion del Sistema - ${APP_NAME}</h3>
            <p style="margin: 0; font-size: 14px;">
              <strong>Destinatario original:</strong> ${options.to}<br>
              <strong>Tipo de notificacion:</strong> ${this.getEmailType(options.subject)}
            </p>
          </div>
          ${options.html}
          <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;"><strong>Nota del sistema:</strong></p>
            <p style="margin: 5px 0 0 0;">Este email fue interceptado por el sistema de monitoreo. En produccion, este email se enviaria a: <strong>${options.to}</strong></p>
          </div>
        `
        : options.html;
      const to = shouldIntercept ? ADMIN_EMAIL : options.to;

      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to,
        subject: subject,
        html,
        text: options.text,
      });

      if (error) {
        console.error('Error sending email:', error);
        return false;
      }

      if (shouldIntercept) {
        console.log('Email interceptado y enviado a', ADMIN_EMAIL);
        console.log('Destinatario original:', options.to);
      } else {
        console.log('Email enviado a', options.to);
      }
      console.log('Email ID:', data?.id);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Envía email de verificación de cuenta
   */
  static async sendVerificationEmail(
    email: string, 
    userName: string, 
    token: string
  ): Promise<boolean> {
    const verificationUrl = `${APP_URL}/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verifica tu email</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .logo {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo h1 {
            color: #3b82f6;
            margin: 0;
            font-size: 32px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #2563eb;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
          .code {
            background: #f3f4f6;
            padding: 12px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 16px;
            letter-spacing: 2px;
            text-align: center;
            margin: 20px 0;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>${APP_NAME}</h1>
          </div>
          
          <div class="content">
            <h2>¡Hola ${userName}! 👋</h2>
            <p>Gracias por registrarte en ${APP_NAME}. Para completar tu registro y verificar tu cuenta, por favor confirma tu dirección de email.</p>
            
            <p>Haz clic en el botón de abajo para verificar tu email:</p>
            
            <center>
              <a href="${verificationUrl}" class="button">
                Verificar mi email
              </a>
            </center>
            
            <p>O copia y pega este enlace en tu navegador:</p>
            <div class="code">${verificationUrl}</div>
            
            <p><strong>Este enlace expirará en 24 horas.</strong></p>
            
            <p>Si no creaste una cuenta en ${APP_NAME}, puedes ignorar este email de forma segura.</p>
          </div>
          
          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Hola ${userName}!

Gracias por registrarte en ${APP_NAME}. Para verificar tu email, visita este enlace:

${verificationUrl}

Este enlace expirará en 24 horas.

Si no creaste una cuenta, puedes ignorar este email.

- Equipo de ${APP_NAME}
    `;

    return this.sendEmail({
      to: email,
      subject: `Verifica tu email en ${APP_NAME}`,
      html,
      text,
    });
  }

  /**
   * Envía email de recuperación de contraseña
   */
  static async sendPasswordResetEmail(
    email: string,
    userName: string,
    token: string
  ): Promise<boolean> {
    const resetUrl = `${APP_URL}/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .logo h1 {
            color: #3b82f6;
            text-align: center;
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .alert {
            background: #fef2f2;
            border-left: 4px solid #ef4444;
            padding: 12px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>${APP_NAME}</h1>
          </div>
          
          <h2>Recuperación de contraseña</h2>
          <p>Hola ${userName},</p>
          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>
          
          <center>
            <a href="${resetUrl}" class="button">
              Restablecer contraseña
            </a>
          </center>
          
          <div class="alert">
            <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
          </div>
          
          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este email de forma segura. Tu contraseña no cambiará.</p>
          
          <div class="footer">
            <p>Por tu seguridad, nunca compartas este enlace con nadie.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Restablece tu contraseña - ${APP_NAME}`,
      html,
    });
  }

  /**
   * Envía invitación a proyecto
   */
  static async sendProjectInvitation(
    email: string,
    inviterName: string,
    projectName: string,
    invitationToken: string,
    recipientName?: string
  ): Promise<boolean> {
    const invitationUrl = `${APP_URL}/login?invitation_token=${invitationToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .logo h1 {
            color: #3b82f6;
            text-align: center;
            margin-bottom: 30px;
          }
          .project-card {
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>${APP_NAME}</h1>
          </div>
          
          <h2>📩 Invitación a proyecto</h2>
          <p>${recipientName ? `Hola ${recipientName}` : 'Hola'},</p>
          <p><strong>${inviterName}</strong> te ha invitado a colaborar en un proyecto.</p>
          
          <div class="project-card">
            <h3 style="margin-top: 0;">📁 ${projectName}</h3>
            <p>Únete al equipo y empieza a colaborar en este proyecto.</p>
          </div>
          
          <center>
            <a href="${invitationUrl}" class="button">
              Aceptar invitación
            </a>
          </center>
          
          <p>Al aceptar esta invitación, tendrás acceso para ver y colaborar en el proyecto.</p>
          
          <p><small>Esta invitación expirará en 7 días.</small></p>
          
          <div class="footer">
            <p>Si no esperabas esta invitación, puedes ignorar este email.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `${inviterName} te invitó a colaborar en ${projectName}`,
      html,
    });
  }

  /**
   * Envía notificación de nueva tarea asignada
   */
  static async sendTaskAssignedEmail(
    email: string,
    userName: string,
    taskTitle: string,
    projectName: string,
    assignedBy: string,
    taskUrl: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .logo h1 {
            color: #3b82f6;
            text-align: center;
            margin-bottom: 30px;
          }
          .task-card {
            background: #eff6ff;
            border-left: 4px solid #3b82f6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>${APP_NAME}</h1>
          </div>
          
          <h2>✅ Nueva tarea asignada</h2>
          <p>Hola ${userName},</p>
          <p><strong>${assignedBy}</strong> te ha asignado una nueva tarea.</p>
          
          <div class="task-card">
            <h3 style="margin-top: 0;">📋 ${taskTitle}</h3>
            <p><strong>Proyecto:</strong> ${projectName}</p>
          </div>
          
          <center>
            <a href="${taskUrl}" class="button">
              Ver tarea
            </a>
          </center>
          
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Nueva tarea: ${taskTitle}`,
      html,
    });
  }

  /**
   * Envía email de bienvenida
   */
  static async sendWelcomeEmail(
    email: string,
    userName: string
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: #ffffff;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 40px;
          }
          .logo h1 {
            color: #3b82f6;
            text-align: center;
            margin-bottom: 30px;
            font-size: 36px;
          }
          .welcome {
            text-align: center;
            font-size: 48px;
            margin: 20px 0;
          }
          .feature {
            background: #f9fafb;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 3px solid #3b82f6;
          }
          .button {
            display: inline-block;
            background-color: #3b82f6;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">
            <h1>${APP_NAME}</h1>
          </div>
          
          <div class="welcome">🎉</div>
          <h2 style="text-align: center;">¡Bienvenido a ${APP_NAME}!</h2>
          
          <p>Hola ${userName},</p>
          <p>Nos alegra que te hayas unido a nuestra plataforma. Estás listo para empezar a gestionar tus proyectos de forma más eficiente.</p>
          
          <h3>¿Qué puedes hacer?</h3>
          
          <div class="feature">
            <strong>📁 Gestionar Proyectos</strong>
            <p>Crea y organiza proyectos, asigna tareas y colabora con tu equipo.</p>
          </div>
          
          <div class="feature">
            <strong>📄 Gestión Documental</strong>
            <p>Organiza y controla tus documentos de forma segura.</p>
          </div>
          
          <div class="feature">
            <strong>🤖 Asistente IA</strong>
            <p>Obtén ayuda de nuestro asistente inteligente para tus tareas.</p>
          </div>
          
          <center>
            <a href="${APP_URL}" class="button">
              Empezar ahora
            </a>
          </center>
          
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
          
          <div class="footer">
            <p>Gracias por confiar en nosotros.</p>
            <p>&copy; ${new Date().getFullYear()} ${APP_NAME}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `¡Bienvenido a ${APP_NAME}! 🎉`,
      html,
    });
  }

  static async sendAdminTwoFactorCode(
    email: string,
    userName: string,
    code: string,
    expiresInMinutes: number
  ): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .container { background: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); padding: 32px; }
          .logo h1 { color: #3b82f6; text-align: center; margin-bottom: 24px; }
          .code { background: #111827; color: #fff; padding: 14px 18px; border-radius: 8px; font-family: monospace; font-size: 28px; letter-spacing: 6px; text-align: center; margin: 20px 0; }
          .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; border-radius: 4px; }
          .footer { margin-top: 24px; font-size: 13px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo"><h1>${APP_NAME}</h1></div>
          <h2>Codigo de acceso de administrador</h2>
          <p>Hola ${userName},</p>
          <p>Usa este codigo para completar el inicio de sesion de administrador:</p>
          <div class="code">${code}</div>
          <div class="alert"><strong>Importante:</strong> este codigo expira en ${expiresInMinutes} minutos.</div>
          <p>Si no intentaste iniciar sesion, cambia tu contrasena inmediatamente.</p>
          <div class="footer"><p>&copy; ${new Date().getFullYear()} ${APP_NAME}</p></div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: email,
      subject: `Codigo de acceso de administrador - ${APP_NAME}`,
      html,
      text: `Tu codigo de acceso es: ${code}. Expira en ${expiresInMinutes} minutos.`,
    });
  }
}
