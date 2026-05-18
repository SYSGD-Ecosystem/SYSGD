package cu.lazaroysr96.sysgdcont.data.model

data class WorkspaceProfile(
    val id: String,
    val nombre: String,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
)

data class AccountingWorkspaceState(
    val cuentasContables: List<CuentaContable> = emptyList(),
    val ingresoGastoCuentas: List<IngresoGastoCuenta> = emptyList(),
    val ingresoGastoNotas: List<IngresoGastoNota> = emptyList(),
    val posIntegrationConfig: PosIntegrationConfig? = null,
    val tributoConfigs: List<TributoConfig> = emptyList(),
    val tributoCuentaBases: List<TributoCuentaBase> = emptyList(),
    val wallets: List<Wallet2> = emptyList(),
    val walletMovimientos: List<WalletMovimiento> = emptyList(),
    val monedas: List<Moneda> = emptyList(),
    val monedaTasas: List<MonedaTasa> = emptyList(),
    val monedaTasaHistorial: List<MonedaTasaHistorial> = emptyList()
)

data class WorkspaceSnapshot(
    val registro: RegistroTCP,
    val accounting: AccountingWorkspaceState = AccountingWorkspaceState(),
    val lastSync: String? = null,
    val ledgerModified: Boolean = false,
    val inventarioModified: Boolean = false,
    val tercerosModified: Boolean = false,
    val serverVersion: String = "",
    val lastDownloadedVersion: String = "",
    val baselineRegistro: RegistroTCP? = null,
    val baselineInventario: InventarioRegistro? = null
)

data class CloudWorkspaceEntry(
    val id: String,
    val name: String,
    val registro: RegistroTCP,
    val accounting: AccountingWorkspaceState = AccountingWorkspaceState()
)

data class CloudLedgerContainer(
    val activeWorkspaceId: String,
    val workspaces: List<CloudWorkspaceEntry> = emptyList()
)
