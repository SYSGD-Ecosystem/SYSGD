package cu.lazaroysr96.sysgdcont.ui.auth

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
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

    val selectAccessKeyLauncher =
            rememberLauncherForActivityResult(contract = ActivityResultContracts.OpenDocument()) {
                    uri ->
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
        if (uiState.isAuthenticated) {
            onLoginSuccess()
        }
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
                modifier =
                        Modifier.fillMaxSize()
                                .padding(padding)
                                .padding(24.dp)
                                .verticalScroll(rememberScrollState()),
                horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Spacer(modifier = Modifier.height(16.dp))

            Text(
                    text = "GESTOR CONTABLE",
                    style = MaterialTheme.typography.headlineLarge,
                    color = MaterialTheme.colorScheme.primary
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                    text = "Registro de Ingresos y Gastos para TCP",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
            )

            Text(
                    text = "SYSGD Ecosystem\n© 2026",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                    text =
                            "Inicia sesión para sincronizar tus datos. Luego podrás usar la app sin conexión.",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )

            Spacer(modifier = Modifier.height(32.dp))

            if (isRegisterMode) {
                OutlinedTextField(
                        value = name,
                        onValueChange = { name = it },
                        label = { Text("Nombre completo") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                        keyboardActions =
                                KeyboardActions(
                                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                                )
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") },
                    singleLine = true,
                    leadingIcon = { Icon(Icons.Default.Email, contentDescription = null) },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions =
                            KeyboardOptions(
                                    keyboardType = KeyboardType.Email,
                                    imeAction = ImeAction.Next
                            ),
                    keyboardActions =
                            KeyboardActions(
                                    onNext = { focusManager.moveFocus(FocusDirection.Down) }
                            )
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (uiState.requiresTwoFactor) {
                OutlinedTextField(
                        value = twoFactorCode,
                        onValueChange = {
                            twoFactorCode = it.filter { ch -> ch.isDigit() }.take(6)
                        },
                        label = { Text("Código 2FA") },
                        singleLine = true,
                        leadingIcon = {
                            Icon(Icons.Default.VerifiedUser, contentDescription = null)
                        },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions =
                                KeyboardOptions(
                                        keyboardType = KeyboardType.Number,
                                        imeAction = ImeAction.Done
                                ),
                        keyboardActions =
                                KeyboardActions(
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
                        leadingIcon = { Icon(Icons.Default.Lock, contentDescription = null) },
                        trailingIcon = {
                            IconButton(onClick = { passwordVisible = !passwordVisible }) {
                                Icon(
                                        if (passwordVisible) Icons.Default.VisibilityOff
                                        else Icons.Default.Visibility,
                                        contentDescription =
                                                if (passwordVisible) "Ocultar" else "Mostrar"
                                )
                            }
                        },
                        visualTransformation =
                                if (passwordVisible) VisualTransformation.None
                                else PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions =
                                KeyboardOptions(
                                        keyboardType = KeyboardType.Password,
                                        imeAction = ImeAction.Done
                                ),
                        keyboardActions =
                                KeyboardActions(
                                        onDone = {
                                            focusManager.clearFocus()
                                            if (isRegisterMode) {
                                                viewModel.register(name, email, password)
                                            } else {
                                                viewModel.login(email, password)
                                            }
                                        }
                                )
                )
            }

            if (uiState.error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                        text = uiState.error!!,
                        color = MaterialTheme.colorScheme.error,
                        style = MaterialTheme.typography.bodySmall
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            Button(
                    onClick = {
                        if (uiState.requiresTwoFactor) {
                            viewModel.verifyTwoFactorCode(twoFactorCode)
                        } else if (isRegisterMode) {
                            if (termsAccepted) {
                                viewModel.register(name, email, password)
                            } else {
                                showTermsDialog = true
                            }
                        } else {
                            viewModel.login(email, password)
                        }
                    },
                    enabled =
                            !uiState.isLoading &&
                                    !uiState.isWakingUp &&
                                    email.isNotBlank() &&
                                    if (uiState.requiresTwoFactor) twoFactorCode.length == 6
                                    else password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth()
            ) {
                if (uiState.isLoading || uiState.isWakingUp) {
                    CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(if (uiState.isWakingUp) "Conectando..." else "Cargando...")
                } else {
                    Text(
                            when {
                                uiState.requiresTwoFactor -> "Verificar código"
                                isRegisterMode -> "Registrarse"
                                else -> "Iniciar Sesión"
                            }
                    )
                }
            }

            val wakeUpMessage = uiState.wakeUpProgress
            if (uiState.isWakingUp && wakeUpMessage != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                        text = wakeUpMessage,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.primary
                )
            }

            if (uiState.requiresTwoFactor) {
                Spacer(modifier = Modifier.height(8.dp))
                TextButton(onClick = { viewModel.resendTwoFactorCode() }) {
                    Text("Reenviar código")
                }
                TextButton(
                        onClick = {
                            viewModel.cancelTwoFactorFlow()
                            twoFactorCode = ""
                        }
                ) { Text("Volver") }
            } else {
                Spacer(modifier = Modifier.height(16.dp))
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
                            if (isRegisterMode) "¿Ya tienes cuenta? Iniciar sesión"
                            else "¿No tienes cuenta? Regístrate"
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            TextButton(onClick = { showAdvancedDialog = true }) {
                Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Método avanzado (token)")
            }

            TextButton(
                    onClick = {
                        selectAccessKeyLauncher.launch(
                                arrayOf("application/json", "text/plain", "*/*")
                        )
                    }
            ) {
                Icon(Icons.Default.Key, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(4.dp))
                Text("Llave de acceso (sin internet)")
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }

    if (showAdvancedDialog) {
        AlertDialog(
                onDismissRequest = { showAdvancedDialog = false },
                title = { Text("Token de Acceso Manual") },
                text = {
                    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                        Text(
                                "Si iniciaste sesión con Google u otro método externo, puedes obtener un token de acceso manual:",
                                style = MaterialTheme.typography.bodySmall
                        )
                        Spacer(modifier = Modifier.height(12.dp))
                        Text(
                                "1. Inicia sesión en la aplicación web",
                                style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                                "2. Abre DevTools (F12) → Application → Local Storage",
                                style = MaterialTheme.typography.bodySmall
                        )
                        Text(
                                "3. Copia el valor de 'sysgd-cont:auth-token'",
                                style = MaterialTheme.typography.bodySmall
                        )
                        Text("4. Pega el token abajo", style = MaterialTheme.typography.bodySmall)
                        Spacer(modifier = Modifier.height(16.dp))
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
                    ) { Text("Usar Token") }
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
                                "Solo cuentas con correo verificado pueden recuperar contraseña automáticamente.",
                                style = MaterialTheme.typography.bodySmall
                        )
                        OutlinedTextField(
                                value = email,
                                onValueChange = { email = it },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                label = { Text("Correo") }
                        )
                        Text(
                                "Si tu correo no está verificado, contacta soporte por WhatsApp (+53 51158544). Respuesta en 72h hábiles.",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                confirmButton = {
                    TextButton(
                            onClick = {
                                viewModel.requestPasswordReset(email)
                                showRecoverDialog = false
                            }
                    ) { Text("Enviar enlace") }
                },
                dismissButton = {
                    Row {
                        TextButton(
                                onClick = {
                                    openWhatsAppSupport(
                                            "Hola, necesito recuperar mi cuenta en SYSGD Cont."
                                    )
                                }
                        ) { Text("Soporte") }
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
                title = { Text("Iniciar con llave de acceso") },
                text = {
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text("Ingresa la contraseña que usaste al crear esta llave de acceso:")
                        OutlinedTextField(
                                value = accessKeyPassword,
                                onValueChange = {
                                    accessKeyPassword = it
                                    accessKeyPasswordError = null
                                },
                                label = { Text("Contraseña") },
                                singleLine = true,
                                visualTransformation =
                                        if (accessKeyPasswordVisible) VisualTransformation.None
                                        else PasswordVisualTransformation(),
                                trailingIcon = {
                                    IconButton(
                                            onClick = {
                                                accessKeyPasswordVisible = !accessKeyPasswordVisible
                                            }
                                    ) {
                                        Icon(
                                                if (accessKeyPasswordVisible)
                                                        Icons.Default.VisibilityOff
                                                else Icons.Default.Visibility,
                                                contentDescription =
                                                        if (accessKeyPasswordVisible) "Ocultar"
                                                        else "Mostrar"
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
                    TextButton(
                            onClick = {
                                if (accessKeyPassword.isBlank()) {
                                    accessKeyPasswordError = "Ingresa la contraseña"
                                } else {
                                    pendingAccessKeyUri?.let { uri ->
                                        viewModel.importAccessKey(uri, accessKeyPassword)
                                    }
                                    showAccessKeyDialog = false
                                    pendingAccessKeyUri = null
                                    accessKeyPassword = ""
                                }
                            }
                    ) { Text("Usar llave") }
                },
                dismissButton = {
                    TextButton(
                            onClick = {
                                showAccessKeyDialog = false
                                pendingAccessKeyUri = null
                                accessKeyPassword = ""
                            }
                    ) { Text("Cancelar") }
                }
        )
    }
}
