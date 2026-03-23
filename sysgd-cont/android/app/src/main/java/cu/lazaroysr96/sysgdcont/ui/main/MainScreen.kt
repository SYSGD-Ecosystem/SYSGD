package cu.lazaroysr96.sysgdcont.ui.main

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudOff
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Help
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.Inventory2
import androidx.compose.material.icons.filled.Logout
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Security
import androidx.compose.material.icons.filled.Sync
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.DrawerValue
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
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import cu.lazaroysr96.sysgdcont.R
import cu.lazaroysr96.sysgdcont.data.model.SyncAction
import cu.lazaroysr96.sysgdcont.ui.main.screens.GastosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.GeneralesScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.IngresosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.InventarioScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.NomenclatorsScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.ResumenScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.SecuritySettingsScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.TributosScreen
import cu.lazaroysr96.sysgdcont.ui.navigation.MainTab
import cu.lazaroysr96.sysgdcont.ui.navigation.mainTabs
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import kotlinx.coroutines.launch

private const val ADMIN_PHONE = "5351158544"
private const val ABOUT_ROUTE = "about"
private const val HELP_ROUTE = "help"
private const val RESOURCES_ROUTE = "resources"
private const val BACKUP_ROUTE = "backup_json"
private const val SECURITY_ROUTE = "security_settings"
private const val VENTAS_ROUTE = "ventas"
private const val NOMENCLATORS_ROUTE = "nomencladores"

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
        ledgerViewModel: LedgerViewModel = hiltViewModel(),
        inventarioViewModel: InventarioViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    // val configuration = LocalConfiguration.current
    // val isLandscape = configuration.screenWidthDp > configuration.screenHeightDp
    val navController = rememberNavController()
    val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
    val authState by authViewModel.uiState.collectAsStateWithLifecycle()
    val ledgerState by ledgerViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val drawerState =
            rememberDrawerState(initialValue = androidx.compose.material3.DrawerValue.Closed)
    val drawerScope = rememberCoroutineScope()
    var showCreditsInfoDialog by remember { mutableStateOf(false) }
    var showVentasHelpDialog by remember { mutableStateOf(false) }
    val exportBackupLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            ledgerViewModel.exportBackup(uri)
        }
    }
    val importBackupLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.OpenDocument()
    ) { uri ->
        if (uri != null) {
            ledgerViewModel.importBackup(uri)
        }
    }

    // val drawerWidthFraction = if (isLandscape) 0.5f else 0.8f

    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        ModalNavigationDrawer(
                drawerState = drawerState,
                drawerContent = {
                    ModalDrawerSheet(
                            modifier = Modifier
                                    .statusBarsPadding()
                                    .navigationBarsPadding()
                    ) {
                    Column(
                            modifier = Modifier.fillMaxSize(),
                            verticalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Spacer(modifier = Modifier.height(12.dp))
                            Box(
                                    modifier =
                                            Modifier.fillMaxWidth()
                                                    .padding(horizontal = 12.dp)
                                                    .background(
                                                            color =
                                                                    MaterialTheme.colorScheme
                                                                            .surfaceVariant.copy(
                                                                            alpha = 0.35f
                                                                    ),
                                                            shape = RoundedCornerShape(16.dp)
                                                    )
                                                    .padding(12.dp)
                            ) {
                                Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                            modifier =
                                                    Modifier.size(52.dp)
                                                            .background(
                                                                    MaterialTheme.colorScheme
                                                                            .surface,
                                                                    CircleShape
                                                            ),
                                            contentAlignment = Alignment.Center
                                    ) {
                                        Image(
                                                painter =
                                                        painterResource(
                                                                id = R.drawable.ic_launcher
                                                        ),
                                                contentDescription = "Icono de la app",
                                                modifier = Modifier.size(36.dp)
                                        )
                                    }
                                    Spacer(modifier = Modifier.width(12.dp))
                                    Column(modifier = Modifier.fillMaxWidth().padding(end = 4.dp)) {
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
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                    text =
                                                            "Créditos: ${authState.availableCredits ?: "--"}",
                                                    style = MaterialTheme.typography.labelMedium,
                                                    color = MaterialTheme.colorScheme.primary
                                            )
                                            IconButton(
                                                    onClick = { showCreditsInfoDialog = true },
                                                    modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(
                                                        imageVector = Icons.Default.Info,
                                                        contentDescription =
                                                                "Información de créditos",
                                                        modifier = Modifier.size(16.dp)
                                                )
                                            }
                                            IconButton(
                                                    onClick = {
                                                        authViewModel.loadAvailableCredits()
                                                    },
                                                    modifier = Modifier.size(24.dp)
                                            ) {
                                                Icon(
                                                        imageVector = Icons.Default.Refresh,
                                                        contentDescription = "Actualizar créditos",
                                                        modifier = Modifier.size(16.dp)
                                                )
                                            }
                                        }
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            Divider()
                            Text(
                                "Registro Contable DJ",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                            
                            NavigationDrawerItem(
                                    label = { Text("Ayuda (llenado)") },
                                    selected = currentRoute == HELP_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.Description, contentDescription = null)
                                    },
                                    onClick = {
                                        navController.navigate(HELP_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                            NavigationDrawerItem(
                                    label = { Text("Recursos útiles") },
                                    selected = currentRoute == RESOURCES_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.Description, contentDescription = null)
                                    },
                                    onClick = {
                                        navController.navigate(RESOURCES_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                            NavigationDrawerItem(
                                    label = { Text("Respaldo JSON") },
                                    selected = currentRoute == BACKUP_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.Description, contentDescription = null)
                                    },
                                    onClick = {
                                        navController.navigate(BACKUP_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider()
                            Text(
                                "Herramientas",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                            NavigationDrawerItem(
                                    label = { Text("Punto de Venta") },
                                    selected = currentRoute == VENTAS_ROUTE,
                                    icon = { Icon(Icons.Default.Inventory2, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(VENTAS_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                            NavigationDrawerItem(
                                    label = { Text("Nomescladores") },
                                    selected = currentRoute == NOMENCLATORS_ROUTE,
                                    icon = { Icon(Icons.Default.Search, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(NOMENCLATORS_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )

                            Spacer(modifier = Modifier.height(12.dp))
                            Divider()

                            NavigationDrawerItem(
                                    label = { Text("Seguridad y cuenta") },
                                    selected = currentRoute == SECURITY_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.Security, contentDescription = null)
                                    },
                                    onClick = {
                                        navController.navigate(SECURITY_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )

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

                            Spacer(modifier = Modifier.height(8.dp))
                        }
                        Column {
                            Divider()
                            NavigationDrawerItem(
                                    label = { Text("Cerrar sesión") },
                                    selected = false,
                                    icon = {
                                        Icon(Icons.Default.Logout, contentDescription = null)
                                    },
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
                modifier = Modifier.statusBarsPadding(),
                snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
                topBar = {
                    TopAppBar(
                            title = {
                                Text(
                                        when (currentRoute) {
                                            ABOUT_ROUTE -> "Acerca de"
                                            HELP_ROUTE -> "Ayuda de llenado"
                                            RESOURCES_ROUTE -> "Recursos útiles"
                                            BACKUP_ROUTE -> "Respaldo JSON"
                                            SECURITY_ROUTE -> "Seguridad y cuenta"
                                            VENTAS_ROUTE -> "Punto de Venta"
                                            NOMENCLATORS_ROUTE -> "Nomescladores"
                                            else -> "Gestor Contable TCP"
                                        }
                                )
                            },
                            navigationIcon = {
                                if (currentRoute == ABOUT_ROUTE || currentRoute == HELP_ROUTE || currentRoute == RESOURCES_ROUTE || currentRoute == BACKUP_ROUTE || currentRoute == SECURITY_ROUTE || currentRoute == VENTAS_ROUTE || currentRoute == NOMENCLATORS_ROUTE) {
                                    IconButton(onClick = { navController.popBackStack() }) {
                                        Icon(
                                                Icons.Default.ArrowBack,
                                                contentDescription = "Regresar"
                                        )
                                    }
                                } else {
                                    IconButton(
                                            onClick = { drawerScope.launch { drawerState.open() } }
                                    ) {
                                        Icon(Icons.Default.Menu, contentDescription = "Abrir menú")
                                    }
                                }
                            },
                            actions = {
                                if (currentRoute == VENTAS_ROUTE) {
                                    IconButton(onClick = { showVentasHelpDialog = true }) {
                                        Icon(
                                            Icons.Default.Help,
                                            contentDescription = "Ayuda de uso del punto de venta"
                                        )
                                    }
                                }
                                if (currentRoute in mainTabs.map { it.route }) {
                                    if (ledgerState.hasLocalChanges && !ledgerState.isSyncing) {
                                        Icon(
                                                Icons.Default.CloudOff,
                                                contentDescription =
                                                        "Cambios locales sin sincronizar",
                                                tint = MaterialTheme.colorScheme.error
                                        )
                                    }
                                    if (ledgerState.isSyncing) {
                                        CircularProgressIndicator(
                                                modifier = Modifier.padding(end = 8.dp).size(24.dp),
                                                strokeWidth = 2.dp
                                        )
                                    } else {
                                        IconButton(onClick = { ledgerViewModel.sync() }) {
                                            Icon(
                                                    Icons.Default.Sync,
                                                    contentDescription = "Sincronizar"
                                            )
                                        }
                                    }
                                }
                            }
                    )
                },
                bottomBar = {
                    if (currentRoute in mainTabs.map { it.route }) {
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
                }
        ) { padding ->
            NavHost(
                    navController = navController,
                    startDestination = MainTab.Generales.route,
                    modifier = Modifier.fillMaxSize().padding(padding)
            ) {
                composable(MainTab.Generales.route) { GeneralesScreen(ledgerViewModel) }
                composable(MainTab.Ingresos.route) { IngresosScreen(ledgerViewModel) }
                composable(MainTab.Gastos.route) { GastosScreen(ledgerViewModel) }
                composable(MainTab.Tributos.route) { TributosScreen(ledgerViewModel) }
                composable(MainTab.Resumen.route) { ResumenScreen(ledgerViewModel) }
                composable(VENTAS_ROUTE) { InventarioScreen(inventarioViewModel) }
                composable(NOMENCLATORS_ROUTE) { NomenclatorsScreen() }
                composable(ABOUT_ROUTE) {
                    AboutScreen(
                            onContactWhatsApp = {
                                val opened =
                                        openWhatsAppContact(
                                                context,
                                                "Hola, necesito ayuda con Gestor Contable TCP."
                                        )
                                if (!opened) {
                                    drawerScope.launch {
                                        snackbarHostState.showSnackbar(
                                                "No se pudo abrir WhatsApp en este dispositivo"
                                        )
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
                                val opened =
                                        openWhatsAppContact(
                                                context,
                                                "Hola, necesito ayuda para llenar correctamente el registro impreso."
                                        )
                                if (!opened) {
                                    drawerScope.launch {
                                        snackbarHostState.showSnackbar(
                                                "No se pudo abrir WhatsApp en este dispositivo"
                                        )
                                    }
                                }
                            },
                    )
                }
                composable(RESOURCES_ROUTE) {
                    UsefulResourcesScreen(
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
                composable(BACKUP_ROUTE) {
                    BackupJsonScreen(
                            isLoading = ledgerState.isLoading,
                            onExportClick = {
                                exportBackupLauncher.launch("sysgd-cont-backup.json")
                            },
                            onImportClick = {
                                importBackupLauncher.launch(arrayOf("application/json", "text/json"))
                            },
                    )
                }
                composable(SECURITY_ROUTE) {
                    SecuritySettingsScreen(
                        authState = authState,
                        authViewModel = authViewModel,
                        onContactSupport = {
                            val opened = openWhatsAppContact(
                                context,
                                "Hola, necesito soporte de seguridad para mi cuenta de SYSGD Cont."
                            )
                            if (!opened) {
                                drawerScope.launch {
                                    snackbarHostState.showSnackbar(
                                        "No se pudo abrir WhatsApp en este dispositivo"
                                    )
                                }
                            }
                        }
                    )
                }
            }
        }
    }
    }

    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            ledgerViewModel.autoSyncOnFirstLogin()
        }
    }

    LaunchedEffect(authState.accountDeleted) {
        if (authState.accountDeleted) {
            onLogout()
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

    ledgerState.backupMessage?.let { message ->
        LaunchedEffect(message) {
            snackbarHostState.showSnackbar(message)
            ledgerViewModel.clearBackupStatus()
        }
    }

    ledgerState.backupError?.let { error ->
        LaunchedEffect(error) {
            snackbarHostState.showSnackbar(error)
            ledgerViewModel.clearBackupStatus()
        }
    }

    ledgerState.pendingSyncDecision?.let { decision ->
        val conflictText = decision.conflictInfo?.conflictMessage.orEmpty()
        val isConflict =
                decision.action == SyncAction.CONFLICT_DETECTED ||
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
                            "No te quedan créditos disponibles para generar nuevos informes.\n\n" +
                                    "Actualmente, el sistema de monetización de la app se encuentra en desarrollo. El uso de funcionalidades premium ha sido limitado para evitar un uso abusivo de nuestros servidores.\n\n" +
                                    "Actualmente no hay costos extras asociados al servicio más allá del pago inicial en APKLIS.\n\n" +
                                    "Si deseas seguir utilizando esta funcionalidad, puede ponerse en contacto con nosotros vía WhatsApp para habilitarle una prueba premium del sistema, con acceso a más recursos. \n\n" +
                                    "Gracias por formar parte de SYSGD Ecosystem."
                    )
                },
                confirmButton = {
                    TextButton(
                            onClick = {
                                ledgerViewModel.dismissNoCreditsDialog()
                                val opened =
                                        openWhatsAppContact(
                                                context,
                                                "Hola, necesito adquirir más créditos para generar informes en Gestor Contable TCP."
                                        )
                                if (!opened) {
                                    drawerScope.launch {
                                        snackbarHostState.showSnackbar(
                                                "No se pudo abrir WhatsApp en este dispositivo"
                                        )
                                    }
                                }
                            }
                    ) { Text("Contactar por WhatsApp") }
                },
                dismissButton = {
                    TextButton(onClick = { ledgerViewModel.dismissNoCreditsDialog() }) {
                        Text("Entendido")
                    }
                }
        )
    }

    if (showCreditsInfoDialog) {
        AlertDialog(
                onDismissRequest = { showCreditsInfoDialog = false },
                title = { Text("Información de créditos") },
                text = {
                    Text(
                            "Actualmente, el sistema de venta de créditos se encuentra en construcción.\n\n" +
                                    "Para proteger la estabilidad de la plataforma durante esta etapa, cada usuario dispone de una cantidad limitada de créditos, lo que nos permite evitar abusos del servicio.\n\n" +
                                    "Por ahora, no existen costos adicionales más allá del pago de descarga en APKLIS.\n\n" +
                                    "Si necesitas más créditos, contáctame por WhatsApp y podré habilitarte acceso premium con una bonificación durante la fase de desarrollo."
                    )
                },
                confirmButton = {
                    TextButton(
                            onClick = {
                                showCreditsInfoDialog = false
                                val opened =
                                        openWhatsAppContact(
                                                context,
                                                "Hola, me interesa acceso premium con bonificación de créditos en Gestor Contable TCP."
                                        )
                                if (!opened) {
                                    drawerScope.launch {
                                        snackbarHostState.showSnackbar(
                                                "No se pudo abrir WhatsApp en este dispositivo"
                                        )
                                    }
                                }
                            }
                    ) { Text("Contactar por WhatsApp") }
                },
                dismissButton = {
                    TextButton(onClick = { showCreditsInfoDialog = false }) { Text("Cerrar") }
                }
        )
    }

    if (showVentasHelpDialog) {
        AlertDialog(
            onDismissRequest = { showVentasHelpDialog = false },
            title = { Text("Cómo usar Punto de Venta") },
            text = {
                Text(
                    "• Toque el botón + para agregar un producto.\n" +
                        "• Toque cualquier producto creado en la pantalla para registrar una compra o venta.\n" +
                        "• Toque la fecha sobre el importe de operaciones diarias para cambiar el día sobre el que está trabajando."
                )
            },
            confirmButton = {
                TextButton(onClick = { showVentasHelpDialog = false }) {
                    Text("Entendido")
                }
            }
        )
    }
}

@Composable
private fun AboutScreen(onContactWhatsApp: () -> Unit, onOpenUrl: (String) -> Unit) {
    val context = LocalContext.current
    val appVersion = remember { getAppVersionName(context) }

    Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Box(
                modifier =
                        Modifier.fillMaxWidth()
                                .background(
                                        color =
                                                MaterialTheme.colorScheme.surfaceVariant.copy(
                                                        alpha = 0.35f
                                                ),
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
                    Text(text = "Gestor Contable TCP", style = MaterialTheme.typography.titleMedium)
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

        TextButton(onClick = onContactWhatsApp) { Text("Contactar por WhatsApp") }

        Divider()

        Text(text = "Plataforma SYSGD Ecosystem", style = MaterialTheme.typography.titleMedium)
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
private fun HelpFillScreen(onContactWhatsApp: () -> Unit) {
    Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
                text = "Guía de llenado del registro impreso",
                style = MaterialTheme.typography.titleMedium
        )
        Text(
                text =
                        "Sigue estas indicaciones al imprimir y llenar el documento generado por la app:",
                style = MaterialTheme.typography.bodyMedium
        )
        Text(
                text =
                        "1. Conservación: el registro debe mantenerse limpio, legible y en buen estado. Conserva comprobantes y facturas por 5 años.",
                style = MaterialTheme.typography.bodySmall
        )
        Text(
                text =
                        "2. Ingresos/Gastos diarios: anota el importe del día en la columna correspondiente al mes y día. Al cierre de mes, totaliza.",
                style = MaterialTheme.typography.bodySmall
        )
        Text(
                text =
                        "3. Correcciones: en caso de error, tacha de forma legible y corrige; evita borrar o tapar la información original.",
                style = MaterialTheme.typography.bodySmall
        )
        Text(
                text =
                        "4. Tributos pagados: registra los importes mensuales por cada concepto en su columna (ventas, fuerza, sellos, anuncios, CSS, otros).",
                style = MaterialTheme.typography.bodySmall
        )
        Text(
                text =
                        "5. Declaración jurada: utiliza los totales mensuales/anuales del registro para preparar correctamente la DJ.",
                style = MaterialTheme.typography.bodySmall
        )
        Text(
                text =
                        "6. Revisión final: antes de presentar, verifica que fechas, importes y totales estén consistentes con tus comprobantes.",
                style = MaterialTheme.typography.bodySmall
        )
        Divider()
        TextButton(onClick = onContactWhatsApp) {
            Text("Necesito ayuda para el llenado (WhatsApp)")
        }
    }
}

@Composable
private fun UsefulResourcesScreen(onOpenUrl: (String) -> Unit) {
    Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
                text = "Recursos útiles para cuentapropistas",
                style = MaterialTheme.typography.titleMedium
        )
        Text(
                text =
                        "En esta sección compartimos enlaces de interés para consultar normas, formularios y guías contables.",
                style = MaterialTheme.typography.bodyMedium
        )

        Divider()

        Text(
                text = "ONAT - Legislación tributaria",
                style = MaterialTheme.typography.titleSmall
        )
        Text(
                text =
                        "Consulta y descarga gacetas oficiales en PDF con las normas legales vigentes que respaldan la Administración Tributaria cubana.",
                style = MaterialTheme.typography.bodySmall
        )
        TextButton(onClick = { onOpenUrl("https://www.onat.gob.cu/home/legislacion") }) {
            Text("Abrir legislación ONAT")
        }

        Text(
                text = "ONAT - Modelos y Formularios",
                style = MaterialTheme.typography.titleSmall
        )
        Text(
                text =
                        "Descarga modelos y formularios en PDF, Excel y Winrar para declarar, pagar tributos y registrar ingresos y gastos.",
                style = MaterialTheme.typography.bodySmall
        )
        TextButton(onClick = { onOpenUrl("https://www.onat.gob.cu/home/modelos-formularios?page=9") }) {
            Text("Abrir modelos y formularios")
        }

        Text(
                text = "Cubadebate - Herramientas y normativas contables TCP",
                style = MaterialTheme.typography.titleSmall
        )
        Text(
                text =
                        "Artículo de apoyo con recomendaciones y normativas para trabajadores por cuenta propia.",
                style = MaterialTheme.typography.bodySmall
        )
        TextButton(onClick = { onOpenUrl("http://www.cubadebate.cu/especiales/2025/03/09/herramientas-y-normativas-contables-para-trabajadores-por-cuenta-propia-que-debes-saber/") }) {
            Text("Abrir artículo en Cubadebate")
        }

        Divider()
        Text(
                text = "Aclaración importante",
                style = MaterialTheme.typography.titleSmall
        )
        Text(
                text =
                        "SYSGD Ecosystem no tiene relación, afiliación ni responsabilidad editorial sobre los sitios enlazados en esta sección. Estos recursos se comparten únicamente con fines informativos por su utilidad para la actividad de los cuentapropistas.",
                style = MaterialTheme.typography.bodySmall
        )
    }
}

@Composable
private fun BackupJsonScreen(
        isLoading: Boolean,
        onExportClick: () -> Unit,
        onImportClick: () -> Unit
) {
    Column(
            modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text(
                text = "Backup y restauración JSON",
                style = MaterialTheme.typography.titleMedium
        )
        Text(
                text =
                        "Exporta tu registro a un archivo JSON para respaldo, o importa un JSON para restaurar/migrar datos desde otro sistema compatible.",
                style = MaterialTheme.typography.bodySmall
        )
        TextButton(onClick = onExportClick, enabled = !isLoading) {
            Text(if (isLoading) "Procesando..." else "Exportar backup JSON")
        }
        TextButton(onClick = onImportClick, enabled = !isLoading) {
            Text(if (isLoading) "Procesando..." else "Importar backup JSON")
        }
        Divider()
        Text(
                text =
                        "Nota: al importar, los datos locales se reemplazan por los del archivo seleccionado.",
                style = MaterialTheme.typography.bodySmall
        )
    }
}
