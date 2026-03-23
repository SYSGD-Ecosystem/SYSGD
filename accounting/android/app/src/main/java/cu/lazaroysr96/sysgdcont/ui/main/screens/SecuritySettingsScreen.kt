package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import cu.lazaroysr96.sysgdcont.viewmodel.AuthUiState
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel

@Composable
fun SecuritySettingsScreen(
    authState: AuthUiState,
    authViewModel: AuthViewModel,
    onContactSupport: () -> Unit,
) {
    var securityPassword by remember { mutableStateOf("") }
    var deletePassword by remember { mutableStateOf("") }
    var showDeleteDialog by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        authViewModel.loadSecuritySettings()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Card {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Verificación de correo", style = MaterialTheme.typography.titleMedium)
                if (authState.emailVerified) {
                    Text("Tu correo está verificado.", color = MaterialTheme.colorScheme.primary)
                } else {
                    Text(
                        "Tu correo no está verificado. Debes verificarlo para activar 2FA y para recuperar contraseña.",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Button(
                        onClick = { authViewModel.resendVerificationEmail() },
                        enabled = !authState.isSecuritySaving,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Enviar enlace de verificación")
                    }
                }
            }
        }

        Card {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Doble factor de autenticación", style = MaterialTheme.typography.titleMedium)
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Activar 2FA por correo")
                    Switch(
                        checked = authState.twoFactorEnabled,
                        onCheckedChange = {},
                        enabled = false,
                    )
                }

                if (!authState.emailVerified) {
                    Text(
                        "Debes verificar tu correo antes de activar 2FA.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.tertiary,
                    )
                }

                if (authState.twoFactorMandatory) {
                    Text(
                        "2FA es obligatorio para tu rol.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.tertiary,
                    )
                }

                OutlinedTextField(
                    value = securityPassword,
                    onValueChange = { securityPassword = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Confirma tu contraseña") },
                    singleLine = true,
                )

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { authViewModel.updateTwoFactorEnabled(true, securityPassword) },
                        enabled = !authState.twoFactorEnabled && authState.emailVerified && !authState.isSecuritySaving,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Activar")
                    }
                    Button(
                        onClick = { authViewModel.updateTwoFactorEnabled(false, securityPassword) },
                        enabled = authState.twoFactorEnabled && !authState.twoFactorMandatory && !authState.isSecuritySaving,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Desactivar")
                    }
                }
            }
        }

        Card {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Recuperación de contraseña", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Solo disponible para cuentas con correo verificado.",
                    style = MaterialTheme.typography.bodySmall,
                )
                val email = authState.currentUser?.email.orEmpty()
                Button(
                    onClick = { authViewModel.requestPasswordReset(email) },
                    enabled = email.isNotBlank() && authState.emailVerified && !authState.isLoading,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Text("Enviar enlace de recuperación")
                }
                Text(
                    "Si no tienes correo verificado, contacta soporte por WhatsApp (+53 51158544). Respuesta en 72h hábiles.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                TextButton(onClick = onContactSupport) {
                    Text("Contactar soporte")
                }
            }
        }

        Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.35f))) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Text("Zona peligrosa", style = MaterialTheme.typography.titleMedium)
                Text(
                    "Eliminar tu cuenta desactiva el acceso inmediatamente.",
                    style = MaterialTheme.typography.bodySmall,
                )
                OutlinedTextField(
                    value = deletePassword,
                    onValueChange = { deletePassword = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Contraseña para eliminar") },
                    singleLine = true,
                )
                Button(
                    onClick = { showDeleteDialog = true },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !authState.isSecuritySaving,
                ) {
                    Text("Eliminar mi cuenta")
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
    }

    if (showDeleteDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteDialog = false },
            title = { Text("¿Eliminar cuenta?") },
            text = { Text("Esta acción es irreversible.") },
            confirmButton = {
                TextButton(onClick = {
                    authViewModel.deleteOwnAccount(deletePassword)
                    showDeleteDialog = false
                }) {
                    Text("Sí, eliminar")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteDialog = false }) {
                    Text("Cancelar")
                }
            }
        )
    }
}
