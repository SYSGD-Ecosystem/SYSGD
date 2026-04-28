package cu.lazaroysr96.sysgdcont.ui.auth

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.KeyboardArrowDown
import androidx.compose.material.icons.outlined.KeyboardArrowUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import cu.lazaroysr96.sysgdcont.ui.components.TermsAndConditionsDialog
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel

private const val SUPPORT_PHONE = "5351158544"

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoginScreen(onLoginSuccess: () -> Unit, viewModel: AuthViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    val focusManager = LocalFocusManager.current
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isRegisterMode by remember { mutableStateOf(false) }
    var name by remember { mutableStateOf("") }
    var showAdvancedDialog by remember { mutableStateOf(false) }
    var manualToken by remember { mutableStateOf("") }
    var showTermsDialog by remember { mutableStateOf(false) }
    var termsAccepted by remember { mutableStateOf(false) }
    var twoFactorCode by remember { mutableStateOf("") }
    var showRecoverDialog by remember { mutableStateOf(false) }
    var showAccessKeyDialog by remember { mutableStateOf(false) }
    var accessKeyPassword by remember { mutableStateOf("") }
    var accessKeyPasswordVisible by remember { mutableStateOf(false) }
    var accessKeyPasswordError by remember { mutableStateOf<String?>(null) }
    var pendingAccessKeyUri by remember { mutableStateOf<Uri?>(null) }
    var showAdvancedSection by remember { mutableStateOf(false) }

    val selectAccessKeyLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            pendingAccessKeyUri = uri
            accessKeyPassword = ""
            accessKeyPasswordError = null
            showAccessKeyDialog = true
        }
    }

    fun openWhatsAppSupport(message: String) {
        try {
            val uri = Uri.parse("https://wa.me/$SUPPORT_PHONE?text=${Uri.encode(message)}")
            context.startActivity(Intent(Intent.ACTION_VIEW, uri))
        } catch (_: Exception) {}
    }

    LaunchedEffect(uiState.isAuthenticated) {
        if (uiState.isAuthenticated) onLoginSuccess()
    }

    LaunchedEffect(uiState.registerCompleted) {
        if (uiState.registerCompleted) {
            isRegisterMode = false
            password = ""
            manualToken = ""
            viewModel.consumeRegisterCompleted()
        }
    }

    LaunchedEffect(uiState.infoMessage) {
        val message = uiState.infoMessage ?: return@LaunchedEffect
        snackbarHostState.showSnackbar(message)
        viewModel.clearInfoMessage()
    }

    Scaffold(snackbarHost = { SnackbarHost(hostState = snackbarHostState) }) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
        ) {
            // ── Header de marca ──────────────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f))
                    .padding(horizontal = 24.dp, vertical = 28.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(14.dp)
                ) {
                    // Monograma
                    Box(
                        modifier = Modifier
                            .size(48.dp)
                            .clip(RoundedCornerShape(12.dp))
                            .background(MaterialTheme.colorScheme.primary),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = "GC",
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onPrimary,
                            fontWeight = FontWeight.SemiBold
                        )
                    }
                    Column {
                        Text(
                            text = "Gestor Contable",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface
                        )
                        Text(
                            text = "SYSGD Ecosystem · TCP",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                Spacer(Modifier.height(12.dp))

                Text(
                    text = "Inicia sesión para sincronizar tus datos. Podrás usar la app sin conexión después.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    lineHeight = MaterialTheme.typography.bodySmall.lineHeight
                )
            }

            // ── Formulario ───────────────────────────────────────────────
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 24.dp, vertical = 24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                if (isRegisterMode) {
                    OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Nombre completo") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                        keyboardActions = KeyboardActions(
                            onNext = { focusManager.moveFocus(FocusDirection.Down) }
                        )
                    )
                }

                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Correo electrónico") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.Email,
                        imeAction = ImeAction.Next
                    ),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    )
                )

                if (uiState.requiresTwoFactor) {
                    OutlinedTextField(
                        value = twoFactorCode,
                        onValueChange = {
                            twoFactorCode = it.filter { ch -> ch.isDigit() }.take(6)
                        },
                        label = { Text("Código de verificación (2FA)") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Number,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                viewModel.verifyTwoFactorCode(twoFactorCode)
                            }
                        )
                    )
                } else {
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Contraseña") },
                        singleLine = true,
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                    if (passwordVisible) Icons.Default.VisibilityOff
                                    else Icons.Default.Visibility,
                                    contentDescription = if (passwordVisible) "Ocultar" else "Mostrar"
                                )
                            }
                        },
                        visualTransformation = if (passwordVisible) VisualTransformation.None
                                               else PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(
                            keyboardType = KeyboardType.Password,
                            imeAction = ImeAction.Done
                        ),
                        keyboardActions = KeyboardActions(
                            onDone = {
                                focusManager.clearFocus()
                                if (isRegisterMode) viewModel.register(name, email, password)
                                else viewModel.login(email, password)
                            }
                        )
                    )
                }

                // Error inline
                if (uiState.error != null) {
                    Text(
                        text = uiState.error!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                    )
                }

                // Botón principal
                Button(
                    onClick = {
                        when {
                            uiState.requiresTwoFactor -> viewModel.verifyTwoFactorCode(twoFactorCode)
                            isRegisterMode -> if (termsAccepted) viewModel.register(name, email, password)
                                             else showTermsDialog = true
                            else -> viewModel.login(email, password)
                        }
                    },
                    enabled = !uiState.isLoading && !uiState.isWakingUp &&
                            email.isNotBlank() &&
                            if (uiState.requiresTwoFactor) twoFactorCode.length == 6
                            else password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    if (uiState.isLoading || uiState.isWakingUp) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(18.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(if (uiState.isWakingUp) "Conectando..." else "Cargando...")
                    } else {
                        Text(
                            when {
                                uiState.requiresTwoFactor -> "Verificar código"
                                isRegisterMode -> "Crear cuenta"
                                else -> "Iniciar sesión"
                            }
                        )
                    }
                }

                if (uiState.isWakingUp && uiState.wakeUpProgress != null) {
                    Text(
                        text = uiState.wakeUpProgress!!,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.fillMaxWidth()
                    )
                }

                // Acciones secundarias de flujo
                if (uiState.requiresTwoFactor) {
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TextButton(onClick = { viewModel.resendTwoFactorCode() }) {
                            Text("Reenviar código")
                        }
                        TextButton(onClick = {
                            viewModel.cancelTwoFactorFlow()
                            twoFactorCode = ""
                        }) {
                            Text("Volver")
                        }
                    }
                } else {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        if (!isRegisterMode) {
                            TextButton(onClick = { showRecoverDialog = true }) {
                                Text("Olvidé mi contraseña")
                            }
                        }
                        TextButton(
                            onClick = {
                                isRegisterMode = !isRegisterMode
                                termsAccepted = false
                                viewModel.clearError()
                            }
                        ) {
                            Text(
                                if (isRegisterMode) "Ya tengo cuenta"
                                else "Registrarme"
                            )
                        }
                    }
                }

                // ── Acceso avanzado (colapsable) ─────────────────────────
                Divider()

                Column(modifier = Modifier.animateContentSize()) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { showAdvancedSection = !showAdvancedSection }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Acceso avanzado",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Icon(
                            imageVector = if (showAdvancedSection) Icons.Outlined.KeyboardArrowUp
                                          else Icons.Outlined.KeyboardArrowDown,
                            contentDescription = null,
                            modifier = Modifier.size(18.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }

                    AnimatedVisibility(visible = showAdvancedSection) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            AdvancedAccessButton(
                                icon = Icons.Default.Key,
                                label = "Iniciar con token de acceso",
                                onClick = { showAdvancedDialog = true }
                            )
                            AdvancedAccessButton(
                                icon = Icons.Default.FolderOpen,
                                label = "Importar llave de acceso",
                                onClick = {
                                    selectAccessKeyLauncher.launch(
                                        arrayOf("application/json", "text/plain", "*/*")
                                    )
                                }
                            )
                        }
                    }
                }

                Text(
                    text = "© 2026 SYSGD Ecosystem",
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp)
                )
            }
        }
    }

    // ── Diálogos ─────────────────────────────────────────────────────────────

    if (showAdvancedDialog) {
        AlertDialog(
            onDismissRequest = { showAdvancedDialog = false },
            title = { Text("Token de acceso") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Obtén tu token desde la aplicación web:",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        "1. Inicia sesión en work.ecosysgd.com",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        "2. Ve a Ajustes → Tokens",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        "3. Genera o copia tu token de acceso",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        "4. Pégalo aquí abajo",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Spacer(Modifier.height(4.dp))
                    OutlinedTextField(
                        value = manualToken,
                        onValueChange = { manualToken = it },
                        label = { Text("Token JWT") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (manualToken.isNotBlank()) {
                            viewModel.setManualToken(manualToken.trim())
                            showAdvancedDialog = false
                        }
                    },
                    enabled = manualToken.isNotBlank()
                ) { Text("Usar token") }
            },
            dismissButton = {
                TextButton(onClick = { showAdvancedDialog = false }) { Text("Cancelar") }
            }
        )
    }

    if (showRecoverDialog) {
        AlertDialog(
            onDismissRequest = { showRecoverDialog = false },
            title = { Text("Recuperar contraseña") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text(
                        "Solo cuentas con correo verificado pueden recuperar la contraseña automáticamente.",
                        style = MaterialTheme.typography.bodySmall
                    )
                    OutlinedTextField(
                        value = email,
                        onValueChange = { email = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        label = { Text("Correo electrónico") }
                    )
                    Text(
                        "Si tu correo no está verificado, contacta soporte por WhatsApp (+53 51158544). Respuesta en 72h hábiles.",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    viewModel.requestPasswordReset(email)
                    showRecoverDialog = false
                }) { Text("Enviar enlace") }
            },
            dismissButton = {
                Row {
                    TextButton(onClick = {
                        openWhatsAppSupport("Hola, necesito recuperar mi cuenta en SYSGD Cont.")
                    }) { Text("Soporte") }
                    TextButton(onClick = { showRecoverDialog = false }) { Text("Cerrar") }
                }
            }
        )
    }

    if (showTermsDialog) {
        TermsAndConditionsDialog(
            onAccept = {
                termsAccepted = true
                showTermsDialog = false
                viewModel.register(name, email, password)
            },
            onDismiss = { showTermsDialog = false }
        )
    }

    if (showAccessKeyDialog && pendingAccessKeyUri != null) {
        AlertDialog(
            onDismissRequest = {
                showAccessKeyDialog = false
                pendingAccessKeyUri = null
                accessKeyPassword = ""
            },
            title = { Text("Llave de acceso") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Ingresa la contraseña que usaste al crear esta llave:")
                    OutlinedTextField(
                        value = accessKeyPassword,
                        onValueChange = {
                            accessKeyPassword = it
                            accessKeyPasswordError = null
                        },
                        label = { Text("Contraseña") },
                        singleLine = true,
                        visualTransformation = if (accessKeyPasswordVisible) VisualTransformation.None
                                               else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { accessKeyPasswordVisible = !accessKeyPasswordVisible }) {
                                Icon(
                                    if (accessKeyPasswordVisible) Icons.Default.VisibilityOff
                                    else Icons.Default.Visibility,
                                    contentDescription = if (accessKeyPasswordVisible) "Ocultar" else "Mostrar"
                                )
                            }
                        },
                        isError = accessKeyPasswordError != null
                    )
                    if (accessKeyPasswordError != null) {
                        Text(
                            text = accessKeyPasswordError!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    if (accessKeyPassword.isBlank()) {
                        accessKeyPasswordError = "Ingresa la contraseña"
                    } else {
                        pendingAccessKeyUri?.let { viewModel.importAccessKey(it, accessKeyPassword) }
                        showAccessKeyDialog = false
                        pendingAccessKeyUri = null
                        accessKeyPassword = ""
                    }
                }) { Text("Usar llave") }
            },
            dismissButton = {
                TextButton(onClick = {
                    showAccessKeyDialog = false
                    pendingAccessKeyUri = null
                    accessKeyPassword = ""
                }) { Text("Cancelar") }
            }
        )
    }
}

// ── Botón de acceso avanzado ──────────────────────────────────────────────────

@Composable
private fun AdvancedAccessButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(8.dp))
            .border(
                width = 0.5.dp,
                color = MaterialTheme.colorScheme.outlineVariant,
                shape = RoundedCornerShape(8.dp)
            )
            .clickable(onClick = onClick)
            .padding(horizontal = 14.dp, vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(10.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            modifier = Modifier.size(16.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = label,
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}