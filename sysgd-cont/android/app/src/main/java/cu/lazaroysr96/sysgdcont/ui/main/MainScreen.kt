package cu.lazaroysr96.sysgdcont.ui.main

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import cu.lazaroysr96.sysgdcont.ui.main.screens.*
import cu.lazaroysr96.sysgdcont.ui.navigation.MainTab
import cu.lazaroysr96.sysgdcont.ui.navigation.mainTabs
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel
import cu.lazaroysr96.sysgdcont.viewmodel.LedgerViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onLogout: () -> Unit,
    authViewModel: AuthViewModel = hiltViewModel(),
    ledgerViewModel: LedgerViewModel = hiltViewModel()
) {
    val navController = rememberNavController()
    val ledgerState by ledgerViewModel.uiState.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }

    Scaffold(
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("SYSGD Cont") },
                actions = {
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
                                .size(24.dp)
                                .padding(end = 8.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(onClick = { ledgerViewModel.sync() }) {
                            Icon(Icons.Default.Sync, contentDescription = "Sincronizar")
                        }
                    }
                    IconButton(onClick = {
                        authViewModel.logout()
                        onLogout()
                    }) {
                        Icon(Icons.Default.Logout, contentDescription = "Cerrar sesión")
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
                        selected = navController.currentBackStackEntryAsState().value?.destination?.route == tab.route,
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
            modifier = Modifier.padding(padding)
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
        }
    }

    // Show sync result
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

    ledgerState.pendingSyncDecision?.let { decision ->
        val conflictText = decision.conflictInfo?.conflictMessage.orEmpty()
        val isConflict = decision.action == cu.lazaroysr96.sysgdcont.data.model.SyncAction.CONFLICT_DETECTED ||
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
                Row {
                    if (decision.remoteRegistro != null) {
                        TextButton(onClick = { ledgerViewModel.confirmUseRemote() }) {
                            Text("Usar nube")
                        }
                    }
                    if (decision.action == cu.lazaroysr96.sysgdcont.data.model.SyncAction.PUSH_ONLY || isConflict) {
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
}
