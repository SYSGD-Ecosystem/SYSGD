package cu.lazaroysr96.sysgdcont.ui.main.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class DummyWalletUi(
    val nombre: String,
    val tipo: String,
    val saldoActual: Double,
)

data class DummyWalletMovimientoUi(
    val fecha: String,
    val tipo: String,
    val origen: String,
    val destino: String,
    val descripcion: String,
    val monto: Double,
)

@Composable
fun CajaBancoScreen() {
    val wallets = listOf(
        DummyWalletUi("Caja efectivo", "EFECTIVO", 2300.0),
        DummyWalletUi("BPA 9201", "BANCO", 12840.0),
        DummyWalletUi("Saldo móvil", "MOVIL", 540.0),
    )
    val mercanciaValor = 17800.0
    val totalLiquido = wallets.sumOf { it.saldoActual }
    val movimientos = listOf(
        DummyWalletMovimientoUi("2026-05-01", "ENTRADA", "Entrada externa", "Caja efectivo", "Cobro venta POS (EFECTIVO)", 1200.0),
        DummyWalletMovimientoUi("2026-05-01", "TRANSFERENCIA", "BPA 9201", "Caja efectivo", "Retiro para caja", 500.0),
        DummyWalletMovimientoUi("2026-05-02", "SALIDA", "Caja efectivo", "Salida externa", "Pago proveedor", 800.0),
    )

    LazyColumn(
        modifier = Modifier.padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        item {
            Text("Caja y banco", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Interfaz demo con datos hardcodeados (sin persistencia aún).", style = MaterialTheme.typography.bodySmall)
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                wallets.forEach { wallet ->
                    Card(modifier = Modifier.weight(1f), colors = CardDefaults.cardColors()) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text(wallet.nombre, style = MaterialTheme.typography.labelLarge)
                            Text(wallet.tipo, style = MaterialTheme.typography.labelSmall)
                            Text(
                                text = "${"%.2f".format(wallet.saldoActual)} CUP",
                                color = if (wallet.saldoActual >= 0) Color(0xFF047857) else Color(0xFFBE123C),
                                fontWeight = FontWeight.SemiBold,
                            )
                        }
                    }
                }
            }
        }
        item {
            Card {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("Total líquido (sin mercancía)", style = MaterialTheme.typography.labelLarge)
                    Text("${"%.2f".format(totalLiquido)} CUP", fontWeight = FontWeight.Bold)
                    Text("Mercancía a costo: ${"%.2f".format(mercanciaValor)} CUP", color = Color(0xFF0369A1))
                }
            }
        }
        item {
            Text("Movimientos", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.SemiBold)
        }
        items(movimientos) { movimiento ->
            Card {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text("${movimiento.fecha} · ${movimiento.tipo}", style = MaterialTheme.typography.labelLarge)
                    Text("${movimiento.origen} → ${movimiento.destino}", style = MaterialTheme.typography.bodySmall)
                    Text(movimiento.descripcion, style = MaterialTheme.typography.bodySmall)
                    Text("${"%.2f".format(movimiento.monto)} CUP", fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}
