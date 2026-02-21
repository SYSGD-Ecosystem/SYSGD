package cu.lazaroysr96.sysgdcont.ui.main

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.Alignment
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import cu.lazaroysr96.sysgdcont.data.model.SyncAction
import cu.lazaroysr96.sysgdcont.R
import cu.lazaroysr96.sysgdcont.ui.main.screens.GastosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.GeneralesScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.IngresosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.ResumenScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.TributosScreen
import cu.lazaroysr96.sysgdcont.ui.navigation.MainTab
import cu.lazaroysr96.sysgdcont.ui.navigation.mainTabs
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import kotlinx.coroutines.launch

private const val ADMIN_PHONE = "5351158544"
private const val ABOUT_ROUTE = "about"
private const val HELP_ROUTE = "help"

private fun openWhatsAppContact(context: android.content.Context, message: String): Boolean {
    return try {
        val whatsappMessage = Uri.encode(message)
        val whatsappUri = Uri.parse("https://wa.me/$ADMIN_PHONE?text=$whatsappMessage")
        context.startActivity(Intent(Intent.ACTION_VIEW, whatsappUri))
        true
    } catch (_: Exception) {
        false
    }
}

private fun openExternalUrl(context: android.content.Context, url: String): Boolean {
    return try {
        context.startActivity(Intent(Intent.ACTION_VIEW, Uri.parse(url)))
        true
    } catch (_: Exception) {
        false
    }
}

private fun getAppVersionName(context: android.content.Context): String {
    return try {
        val pkgInfo = context.packageManager.getPackageInfo(context.packageName, 0)
        pkgInfo.versionName ?: "1.0"
    } catch (_: Exception) {
        "1.0"
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onLogout: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    ledgerViewModel: LedgerViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val navController = rememberNavController()
    val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
    val authState by authViewModel.uiState.collectAsStateWithLifecycle()
    val ledgerState by ledgerViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val drawerState = rememberDrawerState(initialValue = androidx.compose.material3.DrawerValue.Closed)
    val drawerScope = rememberCoroutineScope()

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                modifier = Modifier.fillMaxWidth(0.8f)
            ) {
                Column(
                    modifier = Modifier.fillMaxSize(),
                    verticalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Spacer(modifier = Modifier.height(12.dp))
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 12.dp)
                                .background(
                                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                                    shape = RoundedCornerShape(16.dp)
                                )
                                .padding(12.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(52.dp)
                                        .background(MaterialTheme.colorScheme.surface, CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Image(
                                        painter = painterResource(id = R.drawable.ic_launcher),
                                        contentDescription = "Icono de la app",
                                        modifier = Modifier.size(36.dp)
                                    )
                                }
                                Spacer(modifier = Modifier.width(12.dp))
                                Column(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(end = 4.dp)
                                ) {
                                    Text(
                                        text = authState.currentUser?.name ?: "Usuario",
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                    Text(
                                        text = authState.currentUser?.email ?: "Sin correo",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Créditos: ${authState.availableCredits ?: "--"}",
                                        style = MaterialTheme.typography.labelMedium,
                                        color = MaterialTheme.colorScheme.primary
                                    )
                                }
                            }
                        }
                        Spacer(modifier = Modifier.height(12.dp))
                        Divider()
                        Spacer(modifier = Modifier.height(8.dp))
                        NavigationDrawerItem(
                            label = { Text("Actualizar créditos") },
                            selected = false,
                            icon = { Icon(Icons.Default.Refresh, contentDescription = null) },
                            onClick = {
                                authViewModel.loadAvailableCredits()
                                drawerScope.launch { drawerState.close() }
                            }
                        )
                        Divider()
                        NavigationDrawerItem(
                            label = { Text("Acerca de") },
                            selected = currentRoute == ABOUT_ROUTE,
                            icon = { Icon(Icons.Default.Info, contentDescription = null) },
                            onClick = {
                                navController.navigate(ABOUT_ROUTE) {
                                    launchSingleTop = true
                                }
                                drawerScope.launch { drawerState.close() }
                            }
                        )
                        NavigationDrawerItem(
                            label = { Text("Ayuda (llenado)") },
                            selected = currentRoute == HELP_ROUTE,
                            icon = { Icon(Icons.Default.Description, contentDescription = null) },
                            onClick = {
                                navController.navigate(HELP_ROUTE) {
                                    launchSingleTop = true
                                }
                                drawerScope.launch { drawerState.close() }
                            }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                    Column {
                        Divider()
                        NavigationDrawerItem(
                            label = { Text("Cerrar sesión") },
                            selected = false,
                            icon = { Icon(Icons.Default.Logout, contentDescription = null) },
                            onClick = {
                                authViewModel.logout()
                                onLogout()
                            }
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                    }
                }
            }
        }
    ) {
        Scaffold(
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
            topBar = {
                TopAppBar(
                    title = {
                        Text(
                            when (currentRoute) {
                                ABOUT_ROUTE -> "Acerca de"
                                HELP_ROUTE -> "Ayuda de llenado"
                                else -> "Gestor Contable TCP"
                            }
                        )
                    },
                    navigationIcon = {
                        if (currentRoute == ABOUT_ROUTE || currentRoute == HELP_ROUTE) {
                            IconButton(onClick = { navController.popBackStack() }) {
                                Icon(Icons.Default.ArrowBack, contentDescription = "Regresar")
                            }
                        } else {
                            IconButton(onClick = { drawerScope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "Abrir menú")
                            }
                        }
                    },
                    actions = {
                        if (currentRoute != ABOUT_ROUTE && currentRoute != HELP_ROUTE) {
                            if (ledgerState.hasLocalChanges && !ledgerState.isSyncing) {
                                Icon(
                                    Icons.Default.CloudOff,
                                    contentDescription = "Cambios locales sin sincronizar",
                                    tint = MaterialTheme.colorScheme.error
                                )
                            }
                            if (ledgerState.isSyncing) {
                                CircularProgressIndicator(
                                    modifier = Modifier
                                        .padding(end = 8.dp)
                                        .size(24.dp),
                                    strokeWidth = 2.dp
                                )
                            } else {
                                IconButton(onClick = { ledgerViewModel.sync() }) {
                                    Icon(Icons.Default.Sync, contentDescription = "Sincronizar")
                                }
                            }
                        }
                    }
                )
            },
            bottomBar = {
                NavigationBar {
                    mainTabs.forEach { tab ->
                        NavigationBarItem(
                            icon = { Icon(tab.icon, contentDescription = tab.title) },
                            label = { Text(tab.title) },
                            selected = currentRoute == tab.route,
                            onClick = {
                                navController.navigate(tab.route) {
                                    popUpTo(navController.graph.startDestinationId)
                                    launchSingleTop = true
                                }
                            }
                        )
                    }
                }
            }
        ) { padding ->
            NavHost(
                navController = navController,
                startDestination = MainTab.Generales.route,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                composable(MainTab.Generales.route) {
                    GeneralesScreen(ledgerViewModel)
                }
                composable(MainTab.Ingresos.route) {
                    IngresosScreen(ledgerViewModel)
                }
                composable(MainTab.Gastos.route) {
                    GastosScreen(ledgerViewModel)
                }
                composable(MainTab.Tributos.route) {
                    TributosScreen(ledgerViewModel)
                }
                composable(MainTab.Resumen.route) {
                    ResumenScreen(ledgerViewModel)
                }
                composable(ABOUT_ROUTE) {
                    AboutScreen(
                        onContactWhatsApp = {
                            val opened = openWhatsAppContact(
                                context,
                                "Hola, necesito ayuda con Gestor Contable TCP."
                            )
                            if (!opened) {
                                drawerScope.launch {
                                    snackbarHostState.showSnackbar("No se pudo abrir WhatsApp en este dispositivo")
                                }
                            }
                        },
                        onOpenUrl = { url ->
                            val opened = openExternalUrl(context, url)
                            if (!opened) {
                                drawerScope.launch {
                                    snackbarHostState.showSnackbar("No se pudo abrir el enlace")
                                }
                            }
                        },
                    )
                }
                composable(HELP_ROUTE) {
                    HelpFillScreen(
                        onContactWhatsApp = {
                            val opened = openWhatsAppContact(
                                context,
                                "Hola, necesito ayuda para llenar correctamente el registro impreso."
                            )
                            if (!opened) {
                                drawerScope.launch {
                                    snackbarHostState.showSnackbar("No se pudo abrir WhatsApp en este dispositivo")
                                }
                            }
                        },
                    )
                }
            }
        }
    }

    ledgerState.syncMessage?.let { message ->
        LaunchedEffect(message) {
            snackbarHostState.showSnackbar(message)
            ledgerViewModel.clearSyncStatus()
        }
    }

    ledgerState.syncError?.let { error ->
        LaunchedEffect(error) {
            snackbarHostState.showSnackbar("Error de sincronización: $error")
            ledgerViewModel.clearSyncStatus()
        }
    }

    LaunchedEffect(ledgerState.pdfIntent) {
        if (ledgerState.pdfIntent != null) {
            authViewModel.loadAvailableCredits()
        }
    }

    ledgerState.pendingSyncDecision?.let { decision ->
        val conflictText = decision.conflictInfo?.conflictMessage.orEmpty()
        val isConflict = decision.action == SyncAction.CONFLICT_DETECTED ||
            (decision.conflictInfo?.hasConflict == true)

        AlertDialog(
            onDismissRequest = { ledgerViewModel.dismissSyncDecision() },
            title = {
                Text(
                    if (isConflict) "Conflicto de sincronización"
                    else "Confirmar sincronización"
                )
            },
            text = {
                Text(
                    buildString {
                        append(decision.message)
                        if (conflictText.isNotBlank()) {
                            append("\n\n")
                            append(conflictText)
                        }
                    }
                )
            },
            dismissButton = {
                TextButton(onClick = { ledgerViewModel.dismissSyncDecision() }) {
                    Text("Cancelar")
                }
            },
            confirmButton = {
                androidx.compose.foundation.layout.Row {
                    if (decision.remoteRegistro != null) {
                        TextButton(onClick = { ledgerViewModel.confirmUseRemote() }) {
                            Text("Usar nube")
                        }
                    }
                    if (decision.action == SyncAction.PUSH_ONLY || isConflict) {
                        TextButton(onClick = { ledgerViewModel.confirmUseLocal() }) {
                            Text("Usar local")
                        }
                    }
                    if (!isConflict && decision.mergedRegistro != null) {
                        TextButton(onClick = { ledgerViewModel.confirmUseMerge() }) {
                            Text("Merge")
                        }
                    }
                }
            }
        )
    }

    if (ledgerState.showNoCreditsDialog) {
        AlertDialog(
            onDismissRequest = { ledgerViewModel.dismissNoCreditsDialog() },
            title = { Text("Créditos agotados") },
            text = {
                Text(
                    ledgerState.noCreditsMessage
                        ?: "No te quedan créditos disponibles para generar más informes. Ponte en contacto con el administrador para adquirir más créditos."
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        ledgerViewModel.dismissNoCreditsDialog()
                        val opened = openWhatsAppContact(
                            context,
                            "Hola, necesito adquirir más créditos para generar informes en Gestor Contable TCP."
                        )
                        if (!opened) {
                            drawerScope.launch {
                                snackbarHostState.showSnackbar("No se pudo abrir WhatsApp en este dispositivo")
                            }
                        }
                    }
                ) {
                    Text("Contactar por WhatsApp")
                }
            },
            dismissButton = {
                TextButton(onClick = { ledgerViewModel.dismissNoCreditsDialog() }) {
                    Text("Cerrar")
                }
            }
        )
    }
}

@Composable
private fun AboutScreen(
    onContactWhatsApp: () -> Unit,
    onOpenUrl: (String) -> Unit
) {
    val context = LocalContext.current
    val appVersion = remember { getAppVersionName(context) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f),
                    shape = RoundedCornerShape(16.dp)
                )
                .padding(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Image(
                    painter = painterResource(id = R.drawable.ic_launcher),
                    contentDescription = "Icono de la app",
                    modifier = Modifier.size(56.dp)
                )
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(
                        text = "Gestor Contable TCP",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "Versión $appVersion",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Desarrollador",
                        style = MaterialTheme.typography.labelMedium,
                    )
                    Text(
                        text = "Licenciado en Contabilidad y Finanzas",
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = "Lázaro Yunier Salazar Rodríguez",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }

        TextButton(onClick = onContactWhatsApp) {
            Text("Contactar por WhatsApp (+53 51158544)")
        }

        Divider()

        Text(
            text = "Plataforma SYSGD Ecosystem",
            style = MaterialTheme.typography.titleMedium
        )
        Text(
            text = "Conoce más servicios y accesos oficiales de SYSGD:",
            style = MaterialTheme.typography.bodyMedium
        )
        TextButton(onClick = { onOpenUrl("https://www.ecosysgd.com") }) {
            Text("Web institucional: www.ecosysgd.com")
        }
        TextButton(onClick = { onOpenUrl("https://cont.ecosysgd.com") }) {
            Text("Versión web de esta app: cont.ecosysgd.com")
        }
        TextButton(onClick = { onOpenUrl("https://work.ecosysgd.com/terms") }) {
            Text("Términos y condiciones")
        }
        TextButton(onClick = { onOpenUrl("https://work.ecosysgd.com/privacy") }) {
            Text("Política de privacidad")
        }
    }
}

@Composable
private fun HelpFillScreen(
    onContactWhatsApp: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
            text = "Guía de llenado del registro impreso",
            style = MaterialTheme.typography.titleMedium
        )
        Text(
            text = "Sigue estas indicaciones al imprimir y llenar el documento generado por la app:",
            style = MaterialTheme.typography.bodyMedium
        )
        Text(
            text = "1. Conservación: el registro debe mantenerse limpio, legible y en buen estado. Conserva comprobantes y facturas por 5 años.",
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            text = "2. Ingresos/Gastos diarios: anota el importe del día en la columna correspondiente al mes y día. Al cierre de mes, totaliza.",
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            text = "3. Correcciones: en caso de error, tacha de forma legible y corrige; evita borrar o tapar la información original.",
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            text = "4. Tributos pagados: registra los importes mensuales por cada concepto en su columna (ventas, fuerza, sellos, anuncios, CSS, otros).",
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            text = "5. Declaración jurada: utiliza los totales mensuales/anuales del registro para preparar correctamente la DJ.",
            style = MaterialTheme.typography.bodySmall
        )
        Text(
            text = "6. Revisión final: antes de presentar, verifica que fechas, importes y totales estén consistentes con tus comprobantes.",
            style = MaterialTheme.typography.bodySmall
        )
        Divider()
        TextButton(onClick = onContactWhatsApp) {
            Text("Necesito ayuda para el llenado (WhatsApp)")
        }
    }
}
