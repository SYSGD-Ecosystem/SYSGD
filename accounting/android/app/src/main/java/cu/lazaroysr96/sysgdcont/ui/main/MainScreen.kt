package cu.lazaroysr96.sysgdcont.ui.main

import android.content.Intent
import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
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
import androidx.compose.foundation.clickable
// import androidx.compose.material.icons.filled.ArrowBack
// import androidx.compose.material.icons.filled.BarChart
// import androidx.compose.material.icons.filled.CloudOff
// import androidx.compose.material.icons.filled.CreditCard
// import androidx.compose.material.icons.filled.Description
// import androidx.compose.material.icons.filled.Help
// import androidx.compose.material.icons.filled.Info
// import androidx.compose.material.icons.filled.Widgets
// import androidx.compose.material.icons.filled.Inventory2
// import androidx.compose.material.icons.filled.List
// import androidx.compose.material.icons.filled.Logout
// import androidx.compose.material.icons.filled.Menu
// import androidx.compose.material.icons.filled.MenuBook
// import androidx.compose.material.icons.filled.People
// import androidx.compose.material.icons.filled.Refresh
// import androidx.compose.material.icons.filled.Search
// import androidx.compose.material.icons.filled.Security
// import androidx.compose.material.icons.filled.Sync
// import androidx.compose.material.icons.filled.Visibility
// import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
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
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Surface
import androidx.compose.material3.Switch
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.datastore.preferences.core.stringPreferencesKey
import cu.lazaroysr96.sysgdcont.R
import cu.lazaroysr96.sysgdcont.core.AppEdition
import cu.lazaroysr96.sysgdcont.data.model.SyncAction
import cu.lazaroysr96.sysgdcont.ui.main.screens.GastosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.GeneralesScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.IngresosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.InventarioScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.NomenclatorsScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.DashboardScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.DocumentosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.LicenseCenterScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.ResumenScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.SecuritySettingsScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.TercerosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.TributosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.CatalogosScreen
import cu.lazaroysr96.sysgdcont.ui.main.screens.CajaBancoScreen
import cu.lazaroysr96.sysgdcont.ui.navigation.MainTab
import cu.lazaroysr96.sysgdcont.ui.navigation.mainTabs
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.DocumentosViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.InventarioViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.PlanPurchaseViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.TarjetaViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.TercerosViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.FacturaViewModel
import kotlinx.coroutines.launch

private const val ADMIN_PHONE = "5351158544"
private const val ABOUT_ROUTE = "about"
private const val LICENSES_ROUTE = "licenses"
private const val HELP_ROUTE = "help"
private const val RESOURCES_ROUTE = "resources"
private const val BACKUP_ROUTE = "backup_json"
private const val SECURITY_ROUTE = "security_settings"
private const val DASHBOARD_ROUTE = "dashboard"
private const val VENTAS_ROUTE = "ventas"
private const val NOMENCLATORS_ROUTE = "nomencladores"
private const val TERCEROS_ROUTE = "terceros"
private const val DOCUMENTOS_ROUTE = "documentos"
private const val CATALOGOS_ROUTE = "catalogos"
private const val CAJA_BANCO_ROUTE = "caja_banco"

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

@Composable
private fun FiscalYearSelector(
        selectedYear: Int,
        onYearSelected: (Int) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val currentYear = remember { java.time.Year.now().value }
    val yearOptions = remember(selectedYear, currentYear) {
        ((currentYear - 2)..(currentYear + 2)).toMutableSet()
                .apply { add(selectedYear) }
                .sortedDescending()
    }

    Box {
        TextButton(onClick = { expanded = true }) {
            Icon(Icons.Default.CalendarToday, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(4.dp))
            Text(selectedYear.toString())
        }
        DropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            yearOptions.forEach { year ->
                DropdownMenuItem(
                        text = { Text(year.toString()) },
                        onClick = {
                            expanded = false
                            if (year != selectedYear) onYearSelected(year)
                        },
                        leadingIcon = {
                            if (year == selectedYear) {
                                Icon(Icons.Default.Check, contentDescription = null)
                            }
                        }
                )
            }
        }
    }
}

@Composable
private fun FeatureUnavailableScreen(message: String) {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        contentAlignment = Alignment.Center
    ) {
        Card {
            Text(
                text = message,
                modifier = Modifier.padding(16.dp),
                style = MaterialTheme.typography.bodyMedium
            )
        }
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
        inventarioViewModel: InventarioViewModel = hiltViewModel(),
        tercerosViewModel: TercerosViewModel = hiltViewModel(),
        tarjetaViewModel: TarjetaViewModel = hiltViewModel(),
        facturaViewModel: FacturaViewModel = hiltViewModel(),
        documentosViewModel: DocumentosViewModel = hiltViewModel(),
        planPurchaseViewModel: PlanPurchaseViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    // val configuration = LocalConfiguration.current
    // val isLandscape = configuration.screenWidthDp > configuration.screenHeightDp
    val navController = rememberNavController()
    val currentRoute = navController.currentBackStackEntryAsState().value?.destination?.route
    val authState by authViewModel.uiState.collectAsStateWithLifecycle()
    val ledgerState by ledgerViewModel.uiState.collectAsStateWithLifecycle()
    val inventarioState by inventarioViewModel.uiState.collectAsStateWithLifecycle()
    val planPurchaseState by planPurchaseViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val drawerState =
            rememberDrawerState(initialValue = androidx.compose.material3.DrawerValue.Closed)
    val drawerScope = rememberCoroutineScope()
    val currentTier = (planPurchaseState.currentPlan?.tier ?: "free").lowercase()
    val hasActiveLicense = planPurchaseState.currentPlan?.hasActivePlan == true && currentTier != "free"
    val isFreemiumBuild = AppEdition.isFreemium
    val canUseProFeatures = !isFreemiumBuild || currentTier == "pro" || currentTier == "vip"
    val canUseVipFeatures = !isFreemiumBuild || currentTier == "vip"
    val workspaceLimitMessage =
        if (isFreemiumBuild && !canUseProFeatures) {
            "El plan Free solo permite un espacio de trabajo. Actualiza a Pro para crear varios negocios."
        } else {
            null
        }
    val licensesDrawerLabel = if (hasActiveLicense) "Ver licencia" else "Comprar licencia"
    val accountingRoutes = remember {
        listOf(
            MainTab.Generales.route,
            MainTab.Ingresos.route,
            MainTab.Gastos.route,
            MainTab.Tributos.route,
            MainTab.Resumen.route
        )
    }
    val syncRoutes = remember { accountingRoutes + DASHBOARD_ROUTE }
    val fiscalYearRoutes = remember { accountingRoutes + VENTAS_ROUTE }
    var showCreditsInfoDialog by remember { mutableStateOf(false) }
    var showVentasHelpDialog by remember { mutableStateOf(false) }
    var showAccessKeyPasswordDialog by remember { mutableStateOf(false) }
    var pendingAccessKeyUri by remember { mutableStateOf<Uri?>(null) }
    var accessKeyPassword by remember { mutableStateOf("") }
    var accessKeyConfirmPassword by remember { mutableStateOf("") }
    var accessKeyPasswordVisible by remember { mutableStateOf(false) }
    var accessKeyPasswordError by remember { mutableStateOf<String?>(null) }
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
            ledgerViewModel.importBackup(uri) {
                inventarioViewModel.refreshAfterRestore()
            }
        }
    }
    val exportAccessKeyLauncher = rememberLauncherForActivityResult(
            contract = ActivityResultContracts.CreateDocument("application/json")
    ) { uri ->
        if (uri != null) {
            pendingAccessKeyUri = uri
            accessKeyPassword = ""
            accessKeyConfirmPassword = ""
            accessKeyPasswordError = null
            showAccessKeyPasswordDialog = true
        }
    }

    LaunchedEffect(isFreemiumBuild, canUseVipFeatures) {
        if (isFreemiumBuild && !canUseVipFeatures && ledgerState.experimentalFeaturesEnabled) {
            ledgerViewModel.setExperimentalFeaturesEnabled(false)
        }
    }


    BoxWithConstraints(modifier = Modifier.fillMaxSize()) {
        ModalNavigationDrawer(
                drawerState = drawerState,
                drawerContent = {
                    ModalDrawerSheet(
                            modifier = Modifier
                                    .statusBarsPadding()
                                    .navigationBarsPadding()
                    ) {
                    Box(modifier = Modifier.fillMaxSize()) {
                        Column(
                            modifier = Modifier
                                .fillMaxSize()
                                .verticalScroll(rememberScrollState())
                                .padding(bottom = 84.dp)
                        ) {
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
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(
                                                    text = authState.currentUser?.name ?: "Usuario",
                                                    style = MaterialTheme.typography.titleSmall
                                            )
                                            Spacer(modifier = Modifier.width(8.dp))
                                            UserTierBadge(currentTier)
                                        }
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
                                "Inicio",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                            NavigationDrawerItem(
                                    label = { Text("Dashboard") },
                                    selected = currentRoute == DASHBOARD_ROUTE,
                                    icon = { Icon(Icons.Default.BarChart, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(DASHBOARD_ROUTE) {
                                            popUpTo(navController.graph.startDestinationId)
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider()
                            Text(
                                "Registro Contable DJ",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                            NavigationDrawerItem(
                                    label = { Text("Registro Contable DJ") },
                                    selected = currentRoute == MainTab.Generales.route,
                                    icon = { Icon(Icons.Default.MenuBook, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(MainTab.Generales.route) {
                                            popUpTo(navController.graph.startDestinationId)
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
                            if (canUseProFeatures) {
                            NavigationDrawerItem(
                                    label = { Text("Caja y banco") },
                                    selected = currentRoute == CAJA_BANCO_ROUTE,
                                    icon = { Icon(Icons.Default.AccountBalanceWallet, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(CAJA_BANCO_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                                }
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
                            if (canUseProFeatures) {
                                NavigationDrawerItem(
                                        label = { Text("Nomencladores") },
                                        selected = currentRoute == NOMENCLATORS_ROUTE,
                                        icon = { Icon(Icons.Default.List, contentDescription = null) },
                                        onClick = {
                                            navController.navigate(NOMENCLATORS_ROUTE) {
                                                launchSingleTop = true
                                            }
                                            drawerScope.launch { drawerState.close() }
                                        }
                                )
                            }
                            if (canUseProFeatures) {
                                NavigationDrawerItem(
                                        label = { Text("Terceros") },
                                        selected = currentRoute == TERCEROS_ROUTE,
                                        icon = { Icon(Icons.Default.People, contentDescription = null) },
                                        onClick = {
                                            navController.navigate(TERCEROS_ROUTE) {
                                                launchSingleTop = true
                                            }
                                            drawerScope.launch { drawerState.close() }
                                        }
                                )
                            }
                            NavigationDrawerItem(
                                    label = { Text("Documentos") },
                                    selected = currentRoute == DOCUMENTOS_ROUTE,
                                    icon = { Icon(Icons.Default.Description, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(DOCUMENTOS_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )

                          
                            if (canUseProFeatures) {
                            Spacer(modifier = Modifier.height(8.dp))
                            Divider()
                            Text(
                                "Catálogo",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )

                            NavigationDrawerItem(
                                    label = { Text("Cuentas y Productos") },
                                    selected = currentRoute == CATALOGOS_ROUTE,
                                    icon = { Icon(Icons.Default.Widgets, contentDescription = null) },
                                    onClick = {
                                        navController.navigate(CATALOGOS_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )
                                }

                            Spacer(modifier = Modifier.height(12.dp))
                            Divider()
                            Text(
                                "Cuenta y plataforma",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )

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
                                    label = { Text(licensesDrawerLabel) },
                                    selected = currentRoute == LICENSES_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.CreditCard, contentDescription = null)
                                    },
                                    onClick = {
                                        planPurchaseViewModel.loadData(force = true)
                                        navController.navigate(LICENSES_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )

                            NavigationDrawerItem(
                                    label = { Text("Respaldo y acceso") },
                                    selected = currentRoute == BACKUP_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.Sync, contentDescription = null)
                                    },
                                    onClick = {
                                        navController.navigate(BACKUP_ROUTE) {
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
                            Divider()
                            Text(
                                "Guías y apoyo",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                                modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                            )
                            
                            NavigationDrawerItem(
                                    label = { Text("Ayuda (llenado)") },
                                    selected = currentRoute == HELP_ROUTE,
                                    icon = {
                                        Icon(Icons.Default.Help, contentDescription = null)
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
                                        Icon(Icons.Default.Search, contentDescription = null)
                                    },
                                    onClick = {
                                        navController.navigate(RESOURCES_ROUTE) {
                                            launchSingleTop = true
                                        }
                                        drawerScope.launch { drawerState.close() }
                                    }
                            )

                            Spacer(modifier = Modifier.height(16.dp))
                        }
                        Column(modifier = Modifier.align(Alignment.BottomStart)) {
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
                                            DASHBOARD_ROUTE -> "Gestor Contable TCP"
                                            ABOUT_ROUTE -> "Acerca de"
                                            LICENSES_ROUTE -> if (hasActiveLicense) "Tu licencia" else "Comprar licencia"
                                            HELP_ROUTE -> "Ayuda de llenado"
                                            RESOURCES_ROUTE -> "Recursos útiles"
                                            BACKUP_ROUTE -> "Respaldo y acceso"
                                            SECURITY_ROUTE -> "Seguridad y cuenta"
                                            VENTAS_ROUTE -> "Punto de Venta"
                                            NOMENCLATORS_ROUTE -> "Nomencladores"
                                            TERCEROS_ROUTE -> "Terceros"
                                            DOCUMENTOS_ROUTE -> "Documentos"
                                            CATALOGOS_ROUTE -> "Catálogos"
                                            CAJA_BANCO_ROUTE -> "Caja y banco"
                                            else -> "Gestor Contable TCP"
                                        }
                                )
                            },
                            navigationIcon = {
                                if (currentRoute == ABOUT_ROUTE || currentRoute == LICENSES_ROUTE || currentRoute == HELP_ROUTE || currentRoute == RESOURCES_ROUTE || currentRoute == BACKUP_ROUTE || currentRoute == SECURITY_ROUTE || currentRoute == VENTAS_ROUTE || currentRoute == NOMENCLATORS_ROUTE || currentRoute == TERCEROS_ROUTE || currentRoute == DOCUMENTOS_ROUTE || currentRoute == CATALOGOS_ROUTE || currentRoute == CAJA_BANCO_ROUTE) {
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
                                if (currentRoute in fiscalYearRoutes) {
                                    FiscalYearSelector(
                                            selectedYear = ledgerState.registro.generales.anio,
                                            onYearSelected = { year ->
                                                ledgerViewModel.selectFiscalYear(year)
                                                if (currentRoute == VENTAS_ROUTE) {
                                                    val adjustedDate = runCatching {
                                                        inventarioState.fechaTrabajo.withYear(year)
                                                    }.getOrDefault(inventarioState.fechaTrabajo)
                                                    inventarioViewModel.setFechaTrabajo(adjustedDate)
                                                }
                                            }
                                    )
                                }
                                if (currentRoute == VENTAS_ROUTE) {
                                    IconButton(onClick = { showVentasHelpDialog = true }) {
                                        Icon(
                                            Icons.Default.Help,
                                            contentDescription = "Ayuda de uso del punto de venta"
                                        )
                                    }
                                }
                                if (currentRoute in syncRoutes) {
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
                    if (currentRoute in accountingRoutes) {
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
                    startDestination = DASHBOARD_ROUTE,
                    modifier = Modifier.fillMaxSize().padding(padding)
            ) {
                composable(DASHBOARD_ROUTE) {
                    DashboardScreen(
                        generales = ledgerState.registro.generales,
                        report = ledgerState.annualReport,
                        lastSync = ledgerState.lastSync,
                        hasLocalChanges = ledgerState.hasLocalChanges,
                        workspaces = ledgerState.workspaceProfiles,
                        currentWorkspaceId = ledgerState.currentWorkspaceId,
                        cuentasIngreso = ledgerState.cuentasIngreso,
                        cuentasGasto = ledgerState.cuentasGasto,
                        onSwitchWorkspace = ledgerViewModel::switchWorkspace,
                        onCreateWorkspace = ledgerViewModel::createWorkspace,
                        canCreateWorkspace = canUseProFeatures,
                        workspaceLimitMessage = workspaceLimitMessage,
                        onOpenRegistro = {
                            navController.navigate(MainTab.Generales.route) {
                                launchSingleTop = true
                            }
                        },
                        onOpenVentas = {
                            navController.navigate(VENTAS_ROUTE) {
                                launchSingleTop = true
                            }
                        },
                        onOpenNomencladores = {
                            if (canUseProFeatures) {
                                navController.navigate(NOMENCLATORS_ROUTE) {
                                    launchSingleTop = true
                                }
                            }
                        },
                        showNomencladoresShortcut = canUseProFeatures,
                        onOpenCatalogos = {
                            navController.navigate(CATALOGOS_ROUTE) {
                                launchSingleTop = true
                            }
                        },
                        onOpenTerceros = {
                            if (canUseProFeatures) {
                                navController.navigate(TERCEROS_ROUTE) {
                                    launchSingleTop = true
                                }
                            }
                        },
                        showTercerosShortcut = canUseProFeatures,
                        onOpenDocumentos = {
                            navController.navigate(DOCUMENTOS_ROUTE) {
                                launchSingleTop = true
                            }
                        },
                        onQuickRegisterOperation = { fecha, ingreso, ingresoCuentaId, gasto, gastoCuentaId, nota ->
                            val month = cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants.MONTHS
                                .getOrElse(fecha.monthValue - 1) {
                                    cu.lazaroysr96.sysgdcont.data.repository.LedgerConstants.MONTHS.first()
                                }
                            val dia = fecha.dayOfMonth
                            ledgerViewModel.registrarOperacionRapida(
                                month = month,
                                dia = dia,
                                ingreso = ingreso,
                                ingresoCuentaId = ingresoCuentaId.orEmpty(),
                                gasto = gasto,
                                gastoCuentaId = gastoCuentaId.orEmpty(),
                                nota = nota,
                                year = fecha.year
                            )
                        },
                                userName = authState.currentUser?.name ?: "Usuario",
        userEmail = authState.currentUser?.email ?: "",
        availableCredits = authState.availableCredits,
        currentTier = currentTier,
        hasActiveLicense = hasActiveLicense,
        onNavigateToLicenses = {
            planPurchaseViewModel.loadData(force = true)
            navController.navigate(LICENSES_ROUTE) { launchSingleTop = true }
        },
        onNavigateToSecurity = {
            navController.navigate(SECURITY_ROUTE) { launchSingleTop = true }
        },
        onContactWhatsApp = {
            openWhatsAppContact(context, "Hola, necesito ayuda con Gestor Contable TCP.")
        },
        ledgerViewModel,
                    )
                }
                composable(MainTab.Generales.route) { GeneralesScreen(ledgerViewModel) }
                composable(MainTab.Ingresos.route) { IngresosScreen(ledgerViewModel) }
                composable(MainTab.Gastos.route) { GastosScreen(ledgerViewModel) }
                composable(MainTab.Tributos.route) { TributosScreen(ledgerViewModel) }
                composable(MainTab.Resumen.route) {
                    ResumenScreen(
                        ledgerViewModel,
                        experimentalFeaturesEnabled = ledgerState.experimentalFeaturesEnabled,
                    )
                }
                composable(VENTAS_ROUTE) {
                    InventarioScreen(
                        inventarioViewModel,
                        facturaViewModel,
                        canUseProFeatures,
                        canUseProFeatures,
                    )
                }
                composable(NOMENCLATORS_ROUTE) {
                    if (canUseProFeatures) {
                        NomenclatorsScreen()
                    } else {
                        FeatureUnavailableScreen("Nomencladores no está disponible en la versión Freemium.")
                    }
                }
                composable(TERCEROS_ROUTE) {
                    if (canUseProFeatures) {
                        TercerosScreen(tercerosViewModel, tarjetaViewModel)
                    } else {
                        FeatureUnavailableScreen("Terceros requiere plan Pro en la app Freemium.")
                    }
                }
                composable(DOCUMENTOS_ROUTE) { DocumentosScreen(documentosViewModel) }
                composable(CATALOGOS_ROUTE) { 
                    CatalogosScreen(
                        onNavigateBack = { navController.popBackStack() },
                        inventarioViewModel = inventarioViewModel,
                        ledgerViewModel = ledgerViewModel
                    ) 
                }
                composable(CAJA_BANCO_ROUTE) {
                    CajaBancoScreen()
                }
                composable(LICENSES_ROUTE) {
                    LicenseCenterScreen(
                        experimentalFeaturesEnabled = ledgerState.experimentalFeaturesEnabled,
                        uiState = planPurchaseState,
                        onRefresh = { planPurchaseViewModel.loadData(force = true) },
                        onSubmit = planPurchaseViewModel::submitOrder,
                        onDismissError = planPurchaseViewModel::clearError,
                        onDismissInfo = planPurchaseViewModel::clearInfoMessage,
                        isProDistribution = !isFreemiumBuild
                    )
                }
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
                            experimentalFeaturesEnabled = ledgerState.experimentalFeaturesEnabled,
                            onExperimentalFeaturesChange = ledgerViewModel::setExperimentalFeaturesEnabled,
                            canUseExperimentalFeatures = canUseVipFeatures,
                            currentTier = currentTier,
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
                            isLoading = ledgerState.isLoading || authState.isLoading,
                            currentUser = authState.currentUser,
                            onExportClick = {
                                exportBackupLauncher.launch("sysgd-cont-backup.json")
                            },
                            onImportClick = {
                                importBackupLauncher.launch(arrayOf("application/json", "text/json"))
                            },
                            onExportAccessKeyClick = {
                                val userEmail = authState.currentUser?.email ?: "sysgd-user"
                                val fileName = "sysgd-access-key-$userEmail.json"
                                exportAccessKeyLauncher.launch(fileName)
                            },
                            canCreateAccessKey = canUseProFeatures,
                            currentTier = currentTier,
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

    LaunchedEffect(ledgerState.syncSuccess) {
        if (ledgerState.syncSuccess) {
            inventarioViewModel.refreshAfterRestore()
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
                        if (decision.action == SyncAction.PUSH_ONLY || decision.action == SyncAction.MERGED || isConflict) {
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

    if (showAccessKeyPasswordDialog && pendingAccessKeyUri != null) {
        AlertDialog(
            onDismissRequest = { 
                showAccessKeyPasswordDialog = false
                pendingAccessKeyUri = null
                accessKeyPassword = ""
                accessKeyConfirmPassword = ""
            },
            title = { Text("Crear llave de acceso") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Esta llave permite iniciar sesión sin internet. Ingresa una contraseña para protegerla:")
                    OutlinedTextField(
                        value = accessKeyPassword,
                        onValueChange = { 
                            accessKeyPassword = it
                            accessKeyPasswordError = null
                        },
                        label = { Text("Contraseña") },
                        singleLine = true,
                        visualTransformation = if (accessKeyPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
                        trailingIcon = {
                            IconButton(onClick = { accessKeyPasswordVisible = !accessKeyPasswordVisible }) {
                                Icon(
                                    if (accessKeyPasswordVisible) Icons.Default.VisibilityOff else Icons.Default.Visibility,
                                    contentDescription = if (accessKeyPasswordVisible) "Ocultar" else "Mostrar"
                                )
                            }
                        },
                        isError = accessKeyPasswordError != null
                    )
                    OutlinedTextField(
                        value = accessKeyConfirmPassword,
                        onValueChange = { 
                            accessKeyConfirmPassword = it
                            accessKeyPasswordError = null
                        },
                        label = { Text("Confirmar contraseña") },
                        singleLine = true,
                        visualTransformation = if (accessKeyPasswordVisible) VisualTransformation.None else PasswordVisualTransformation(),
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
                        when {
                            accessKeyPassword.length < 6 -> {
                                accessKeyPasswordError = "La contraseña debe tener al menos 6 caracteres"
                            }
                            accessKeyPassword != accessKeyConfirmPassword -> {
                                accessKeyPasswordError = "Las contraseñas no coinciden"
                            }
                            else -> {
                                pendingAccessKeyUri?.let { uri ->
                                    authViewModel.exportAccessKey(uri, accessKeyPassword)
                                }
                                showAccessKeyPasswordDialog = false
                                pendingAccessKeyUri = null
                                accessKeyPassword = ""
                                accessKeyConfirmPassword = ""
                            }
                        }
                    }
                ) {
                    Text("Crear")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { 
                        showAccessKeyPasswordDialog = false
                        pendingAccessKeyUri = null
                        accessKeyPassword = ""
                        accessKeyConfirmPassword = ""
                    }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun AboutScreen(
    onContactWhatsApp: () -> Unit,
    onOpenUrl: (String) -> Unit,
    experimentalFeaturesEnabled: Boolean,
    onExperimentalFeaturesChange: (Boolean) -> Unit,
    canUseExperimentalFeatures: Boolean,
    currentTier: String,
) {
    val context = LocalContext.current
    val appVersion = remember { getAppVersionName(context) }
    val colorScheme = MaterialTheme.colorScheme

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {

        // ── Hero: identidad de la app ─────────────────────────────
        Card(
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(containerColor = colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(68.dp)
                        .background(colorScheme.primaryContainer, RoundedCornerShape(20.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.ic_launcher),
                        contentDescription = "Icono de la app",
                        modifier = Modifier.size(48.dp)
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "Gestor Contable TCP",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold,
                        color = colorScheme.onSurface
                    )
                    Surface(
                        shape = RoundedCornerShape(999.dp),
                        color = colorScheme.secondaryContainer,
                        modifier = Modifier.padding(top = 2.dp)
                    ) {
                        Text(
                            text = "v$appVersion",
                            style = MaterialTheme.typography.labelSmall,
                            color = colorScheme.onSecondaryContainer,
                            modifier = Modifier.padding(horizontal = 10.dp, vertical = 3.dp)
                        )
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "Lázaro Yunier Salazar Rodríguez",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = colorScheme.onSurface
                    )
                    Text(
                        text = "Licenciado en Contabilidad y Finanzas",
                        style = MaterialTheme.typography.bodySmall,
                        color = colorScheme.onSurfaceVariant
                    )
                }
            }
        }

        // ── Contacto ──────────────────────────────────────────────
        AboutSectionCard(
            icon = Icons.Default.ContactSupport,
            iconBackground = colorScheme.tertiaryContainer,
            iconTint = colorScheme.onTertiaryContainer,
            title = "Contacto y comunidad",
        ) {
            AboutLinkItem(
                icon = Icons.Default.Chat,
                label = "Soporte por WhatsApp",
                sublabel = "Consultas, reportes y ayuda directa",
                onClick = onContactWhatsApp
            )
            Divider(color = colorScheme.outlineVariant.copy(alpha = 0.5f))
            AboutLinkItem(
                icon = Icons.Default.Campaign,
                label = "Canal oficial en WhatsApp",
                sublabel = "Novedades, actualizaciones y anuncios",
                onClick = { onOpenUrl("https://whatsapp.com/channel/0029Va7WYUfHVvTenVDVnj3W") }
            )
        }

        // ── Plataforma SYSGD ──────────────────────────────────────
        AboutSectionCard(
            icon = Icons.Default.Language,
            iconBackground = colorScheme.primaryContainer,
            iconTint = colorScheme.onPrimaryContainer,
            title = "Plataforma SYSGD Ecosystem",
        ) {
            AboutLinkItem(
                icon = Icons.Default.Public,
                label = "Web institucional",
                sublabel = "www.ecosysgd.com",
                onClick = { onOpenUrl("https://www.ecosysgd.com") }
            )
            Divider(color = colorScheme.outlineVariant.copy(alpha = 0.5f))
            AboutLinkItem(
                icon = Icons.Default.OpenInBrowser,
                label = "Versión web de esta app",
                sublabel = "cont.ecosysgd.com",
                onClick = { onOpenUrl("https://cont.ecosysgd.com") }
            )
            Divider(color = colorScheme.outlineVariant.copy(alpha = 0.5f))
            AboutLinkItem(
                icon = Icons.Default.Gavel,
                label = "Términos y condiciones",
                sublabel = "work.ecosysgd.com/terms",
                onClick = { onOpenUrl("https://work.ecosysgd.com/terms") }
            )
            Divider(color = colorScheme.outlineVariant.copy(alpha = 0.5f))
            AboutLinkItem(
                icon = Icons.Default.Shield,
                label = "Política de privacidad",
                sublabel = "work.ecosysgd.com/privacy",
                onClick = { onOpenUrl("https://work.ecosysgd.com/privacy") }
            )
        }

        // ── Opciones avanzadas ────────────────────────────────────
        AboutSectionCard(
            icon = Icons.Default.Science,
            iconBackground = if (canUseExperimentalFeatures)
                colorScheme.secondaryContainer
            else
                colorScheme.surfaceVariant,
            iconTint = if (canUseExperimentalFeatures)
                colorScheme.onSecondaryContainer
            else
                colorScheme.onSurfaceVariant,
            title = "Opciones avanzadas",
        ) {
            if (!canUseExperimentalFeatures) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = colorScheme.errorContainer.copy(alpha = 0.45f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Lock,
                            contentDescription = null,
                            tint = colorScheme.onErrorContainer,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Requiere plan VIP. Tu nivel actual es ${currentTier.uppercase()}.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colorScheme.onErrorContainer
                        )
                    }
                }
            }

            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                    Text(
                        text = "Funciones experimentales",
                        style = MaterialTheme.typography.bodyMedium,
                        fontWeight = FontWeight.SemiBold,
                        color = if (canUseExperimentalFeatures)
                            colorScheme.onSurface
                        else
                            colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Herramientas en desarrollo como el PDF offline",
                        style = MaterialTheme.typography.bodySmall,
                        color = colorScheme.onSurfaceVariant
                    )
                }
                Switch(
                    checked = experimentalFeaturesEnabled,
                    onCheckedChange = onExperimentalFeaturesChange,
                    enabled = canUseExperimentalFeatures
                )
            }
        }
    }
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

@Composable
private fun AboutSectionCard(
    icon: ImageVector,
    iconBackground: Color,
    iconTint: Color,
    title: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colorScheme = MaterialTheme.colorScheme
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(iconBackground, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = colorScheme.onSurface
                )
            }
            content()
        }
    }
}

@Composable
private fun AboutLinkItem(
    icon: ImageVector,
    label: String,
    sublabel: String,
    onClick: () -> Unit,
) {
    val colorScheme = MaterialTheme.colorScheme
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .clickable(onClick = onClick)
            .padding(vertical = 10.dp, horizontal = 2.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Icon(
            imageVector = icon,
            contentDescription = null,
            tint = colorScheme.primary,
            modifier = Modifier.size(20.dp)
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Medium,
                color = colorScheme.onSurface
            )
            Text(
                text = sublabel,
                style = MaterialTheme.typography.bodySmall,
                color = colorScheme.onSurfaceVariant
            )
        }
        Icon(
            Icons.Default.ChevronRight,
            contentDescription = null,
            tint = colorScheme.onSurfaceVariant,
            modifier = Modifier.size(16.dp)
        )
    }
}

@Composable
private fun UserTierBadge(tier: String) {
    val normalizedTier = tier.lowercase()
    val background = when (normalizedTier) {
        "vip" -> MaterialTheme.colorScheme.tertiaryContainer
        "pro" -> MaterialTheme.colorScheme.primaryContainer
        else -> MaterialTheme.colorScheme.surfaceVariant
    }
    val contentColor = when (normalizedTier) {
        "vip" -> MaterialTheme.colorScheme.onTertiaryContainer
        "pro" -> MaterialTheme.colorScheme.onPrimaryContainer
        else -> MaterialTheme.colorScheme.onSurfaceVariant
    }

    Box(
        modifier = Modifier
            .background(background, CircleShape)
            .padding(horizontal = 10.dp, vertical = 4.dp)
    ) {
        Text(
            text = normalizedTier.uppercase(),
            style = MaterialTheme.typography.labelMedium,
            color = contentColor
        )
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
    currentUser: cu.lazaroysr96.sysgdcont.data.model.AuthUser?,
    onExportClick: () -> Unit,
    onImportClick: () -> Unit,
    onExportAccessKeyClick: () -> Unit,
    canCreateAccessKey: Boolean,
    currentTier: String,
) {
    val colorScheme = MaterialTheme.colorScheme

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 20.dp, vertical = 24.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        // ── Header ───────────────────────────────────────────────
        Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = "Seguridad y respaldo",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = colorScheme.onBackground
            )
            Text(
                text = "Gestiona tus copias de seguridad y acceso sin conexión",
                style = MaterialTheme.typography.bodyMedium,
                color = colorScheme.onSurfaceVariant
            )
        }

        // ── Sección: Backup JSON ──────────────────────────────────
        BackupSectionCard(
            icon = Icons.Default.CloudUpload,
            iconTint = colorScheme.onPrimaryContainer,
            iconBackground = colorScheme.primaryContainer,
            title = "Exportar / Importar JSON",
            description = "Exporta tu registro contable como archivo JSON para respaldo externo, o importa uno para migrar datos desde otro dispositivo compatible.",
            warning = "Al importar, los datos locales actuales serán reemplazados por los del archivo seleccionado.",
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                OutlinedButton(
                    onClick = onExportClick,
                    enabled = !isLoading,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        Icons.Default.FileDownload,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(if (isLoading) "Procesando…" else "Exportar")
                }
                Button(
                    onClick = onImportClick,
                    enabled = !isLoading,
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(
                        Icons.Default.FileUpload,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                    Spacer(Modifier.width(6.dp))
                    Text(if (isLoading) "Procesando…" else "Importar")
                }
            }
        }

        // ── Sección: Llave de acceso ──────────────────────────────
        BackupSectionCard(
            icon = Icons.Default.VpnKey,
            iconTint = colorScheme.onSecondaryContainer,
            iconBackground = colorScheme.secondaryContainer,
            title = "Llave de acceso sin conexión",
            description = "Crea una copia cifrada de tu sesión para iniciar sin internet. Si reinstalás la app, podrás restaurar tu sesión usando esta llave.",
            warning = "La llave se protegerá con una contraseña que tú defines. Guárdala en un lugar seguro.",
        ) {
            // Info del usuario activo
            if (currentUser != null) {
                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = colorScheme.surfaceVariant,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 14.dp, vertical = 10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(10.dp)
                    ) {
                        Icon(
                            Icons.Default.AccountCircle,
                            contentDescription = null,
                            tint = colorScheme.primary,
                            modifier = Modifier.size(32.dp)
                        )
                        Column {
                            Text(
                                text = currentUser.name,
                                style = MaterialTheme.typography.labelLarge,
                                fontWeight = FontWeight.SemiBold,
                                color = colorScheme.onSurface
                            )
                            Text(
                                text = currentUser.email,
                                style = MaterialTheme.typography.bodySmall,
                                color = colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
                Spacer(Modifier.height(4.dp))
            }

            // Botón + aviso de plan
            Button(
                onClick = onExportAccessKeyClick,
                enabled = !isLoading && canCreateAccessKey,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = colorScheme.secondary,
                    contentColor = colorScheme.onSecondary,
                    disabledContainerColor = colorScheme.surfaceVariant,
                    disabledContentColor = colorScheme.onSurfaceVariant
                )
            ) {
                Icon(
                    if (isLoading) Icons.Default.HourglassTop else Icons.Default.Key,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp)
                )
                Spacer(Modifier.width(8.dp))
                Text(if (isLoading) "Procesando…" else "Crear llave de acceso")
            }

            if (!canCreateAccessKey) {
                Surface(
                    shape = RoundedCornerShape(10.dp),
                    color = colorScheme.errorContainer.copy(alpha = 0.55f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Lock,
                            contentDescription = null,
                            tint = colorScheme.onErrorContainer,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Requiere plan Pro o VIP. Tu nivel actual es ${currentTier.uppercase()}.",
                            style = MaterialTheme.typography.bodySmall,
                            color = colorScheme.onErrorContainer
                        )
                    }
                }
            }
        }
    }
}

// ── Componente auxiliar de sección ───────────────────────────────────────────

@Composable
private fun BackupSectionCard(
    icon: ImageVector,
    iconTint: Color,
    iconBackground: Color,
    title: String,
    description: String,
    warning: String? = null,
    content: @Composable ColumnScope.() -> Unit,
) {
    val colorScheme = MaterialTheme.colorScheme
    Card(
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Icono + título
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Box(
                    modifier = Modifier
                        .size(44.dp)
                        .background(iconBackground, RoundedCornerShape(14.dp)),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = null,
                        tint = iconTint,
                        modifier = Modifier.size(22.dp)
                    )
                }
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.SemiBold,
                    color = colorScheme.onSurface
                )
            }

            Text(
                text = description,
                style = MaterialTheme.typography.bodySmall,
                color = colorScheme.onSurfaceVariant,
                lineHeight = MaterialTheme.typography.bodySmall.lineHeight
            )

            // Contenido inyectado (botones, campos, etc.)
            content()

            // Aviso al pie (opcional)
            if (warning != null) {
                Divider(color = colorScheme.outlineVariant)
                Row(
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Icon(
                        Icons.Default.Info,
                        contentDescription = null,
                        tint = colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(14.dp).padding(top = 1.dp)
                    )
                    Text(
                        text = warning,
                        style = MaterialTheme.typography.bodySmall,
                        color = colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}
