package cu.lazaroysr96.sysgdcont.data.repository

import cu.lazaroysr96.sysgdcont.data.dao.CajaBancoDao
import cu.lazaroysr96.sysgdcont.data.model.Moneda
import cu.lazaroysr96.sysgdcont.data.model.MonedaTasa
import cu.lazaroysr96.sysgdcont.data.model.MonedaTasaHistorial
import cu.lazaroysr96.sysgdcont.data.model.Wallet2
import cu.lazaroysr96.sysgdcont.data.model.WalletMovimiento
import cu.lazaroysr96.sysgdcont.data.model.WalletMovimientoTipo
import cu.lazaroysr96.sysgdcont.data.model.WalletReferenciaTipo
import cu.lazaroysr96.sysgdcont.data.model.WalletTipo
import kotlinx.coroutines.flow.Flow
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class CajaBancoRepository @Inject constructor(
    private val cajaBancoDao: CajaBancoDao,
) {
    val monedas: Flow<List<Moneda>> = cajaBancoDao.getMonedas()
    val monedaTasas: Flow<List<MonedaTasa>> = cajaBancoDao.getMonedaTasas()
    val monedaTasaHistorial: Flow<List<MonedaTasaHistorial>> = cajaBancoDao.getMonedaTasaHistorial()
    val wallets: Flow<List<Wallet2>> = cajaBancoDao.getWallets()
    val movimientos: Flow<List<WalletMovimiento>> = cajaBancoDao.getMovimientos()

    suspend fun ensureConfiguracionInicial() {
        if (cajaBancoDao.countMonedas() == 0) {
            crearMoneda(nombre = "Peso Cubano", tipo = "CUP", tasaInicial = 1.0)
        }
    }

    suspend fun crearMoneda(nombre: String, tipo: String, tasaInicial: Double): Moneda {
        val now = System.currentTimeMillis()
        val tipoNormalizado = tipo.trim().uppercase()
        val tasa = MonedaTasa(
            id = UUID.randomUUID().toString(),
            nombre = "Tasa $tipoNormalizado",
            tasa = tasaInicial,
            createdAt = now,
            updatedAt = now,
        )
        val moneda = Moneda(
            id = UUID.randomUUID().toString(),
            nombre = nombre.trim(),
            tipo = tipoNormalizado,
            tasaId = tasa.id,
            createdAt = now,
            updatedAt = now,
        )
        val historial = MonedaTasaHistorial(
            id = UUID.randomUUID().toString(),
            monedaId = moneda.id,
            tasa = tasaInicial,
            createdAt = now,
        )
        cajaBancoDao.insertMonedaCompleta(moneda, tasa, historial)
        return moneda
    }

    suspend fun actualizarTasa(moneda: Moneda, nuevaTasa: Double, tasaActual: MonedaTasa?) {
        val now = System.currentTimeMillis()
        val tasa = (tasaActual ?: MonedaTasa(moneda.tasaId, "Tasa ${moneda.tipo}", nuevaTasa)).copy(
            tasa = nuevaTasa,
            updatedAt = now,
        )
        if (tasaActual == null) {
            cajaBancoDao.insertMonedaTasa(tasa)
        } else {
            cajaBancoDao.updateMonedaTasa(tasa)
        }
        cajaBancoDao.insertMonedaTasaHistorial(
            MonedaTasaHistorial(
                id = UUID.randomUUID().toString(),
                monedaId = moneda.id,
                tasa = nuevaTasa,
                createdAt = now,
            )
        )
    }

    suspend fun eliminarMoneda(moneda: Moneda) {
        cajaBancoDao.deleteMonedaCompleta(moneda)
    }

    suspend fun crearWallet(nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String): Wallet2 {
        val now = System.currentTimeMillis()
        val wallet = Wallet2(
            id = UUID.randomUUID().toString(),
            nombre = nombre.trim(),
            tipo = tipo,
            saldoInicial = saldo,
            monedaId = monedaId,
            activo = true,
            createdAt = now,
            updatedAt = now,
        )
        cajaBancoDao.insertWallet(wallet)
        return wallet
    }

    suspend fun editarWallet(orig: Wallet2, nombre: String, tipo: WalletTipo, saldo: Double, monedaId: String) {
        cajaBancoDao.updateWallet(
            orig.copy(
                nombre = nombre.trim(),
                tipo = tipo,
                saldoInicial = saldo,
                monedaId = monedaId,
                updatedAt = System.currentTimeMillis(),
            )
        )
    }

    suspend fun eliminarWallet(wallet: Wallet2) {
        cajaBancoDao.deleteWallet(wallet)
    }

    suspend fun registrarMovimiento(
        tipo: WalletMovimientoTipo,
        walletOrigenId: String?,
        walletDestinoId: String?,
        monto: Double,
        monedaId: String,
        tasaAlMomento: Double,
        referenciaTipo: WalletReferenciaTipo,
        nota: String,
        fecha: String,
    ): WalletMovimiento {
        val movimiento = WalletMovimiento(
            id = UUID.randomUUID().toString(),
            walletOrigenId = walletOrigenId,
            walletDestinoId = walletDestinoId,
            monto = monto,
            tasaAlMomento = tasaAlMomento,
            monedaId = monedaId,
            tipo = tipo,
            referenciaTipo = referenciaTipo,
            nota = nota.trim(),
            fecha = fecha,
            createdAt = System.currentTimeMillis(),
        )
        cajaBancoDao.insertMovimiento(movimiento)
        return movimiento
    }

    suspend fun editarNota(movId: String, nota: String) {
        cajaBancoDao.updateMovimientoNota(movId, nota.trim())
    }

    suspend fun eliminarMovimiento(movId: String) {
        cajaBancoDao.deleteMovimiento(movId)
    }
}
