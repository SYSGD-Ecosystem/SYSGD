package cu.lazaroysr96.sysgdcont.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog

@Composable
fun TermsAndConditionsDialog(
    onAccept: () -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .fillMaxHeight(0.9f),
            shape = MaterialTheme.shapes.large
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Términos de Uso",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.primary
                )

                Text(
                    text = "Gestor Contable TCP",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )

                Spacer(modifier = Modifier.height(8.dp))

                Text(
                    text = "Gestor Contable TCP forma parte de la plataforma SYSGD Ecosystem. Al continuar, aceptas nuestros términos y condiciones de uso.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    TermSection(
                        title = "1. Datos que Recopilamos",
                        items = listOf(
                            "✓ Nombre completo y NIT",
                            "✓ Actividad económica y domicilios",
                            "✓ Registros de ingresos, gastos y tributos",
                            "✓ Información fiscal relacionada con tu actividad como TCP"
                        )
                    )

                    TermSection(
                        title = "2. Finalidad del Tratamiento",
                        items = listOf(
                            "• Permitirte llevar tu registro contable digital",
                            "• Generar reportes y PDFs de tu actividad",
                            "• Cumplir con obligaciones de la ONAT"
                        ),
                        emphasis = "❌ NO compartimos, vendemos ni usamos tus datos para otros fines"
                    )

                    TermSection(
                        title = "3. Almacenamiento y Seguridad",
                        items = listOf(
                            "✓ Tus datos se almacenan de forma segura en Supabase",
                            "✓ Encriptación AES-256-GCM (Encriptación de alto nivel, estándar bancario internacional)",
                            "✓ Nunca almacenamos datos en forma textual",
                            "✓ Clave de desencriptación en servidor separado",
                            "✓ Base de datos y servidor en ubicaciones distintas"
                        ),
                        note = "Art. 7, Resolución 58/2022"
                    )

                    TermSection(
                        title = "4. Tus Derechos",
                        items = listOf(
                            "📄 Acceder a tus datos en cualquier momento",
                            "✏️ Rectificar o actualizar información incorrecta",
                            "🗑️ Cancelar tu cuenta y eliminar todos tus datos",
                            "⛔ Oponerte al tratamiento que consideres inadecuado",
                            "📥 Exportar todos tus datos en formato PDF"
                        ),
                        note = "Arts. 19-23"
                    )

                    TermSection(
                        title = "5. Conservación de Datos",
                        items = listOf(
                            "• Tus datos se conservan mientras seas usuario de SYSGD Ecosystem",
                            "• Puedes solicitar eliminación de tu cuenta y datos en cualquier momento",
                        )
                    )

                    TermSection(
                        title = "⚠️ Importante - Fase Beta",
                        items = listOf(
                            "• SYSGD CONT está en pruebas",
                            "• Pueden ocurrir errores ocasionales",
                            "• Recomendamos descargar PDF mensualmente",
                            "• Notificaremos cualquier incidente de seguridad"
                        ),
                        isWarning = true
                    )

                    TermSection(
                        title = "6. Acceso por Administradores",
                        items = listOf(
                            "✓ Soporte técnico cuando lo solicites",
                            "✓ Resolver errores reportados",
                            "✓ Cumplir con requerimientos legales (ONAT, tribunales)"
                        ),
                        emphasis = "Nuestro personal firma acuerdos de confidencialidad",
                        note = "Art. 45"
                    )
                }

                Spacer(modifier = Modifier.height(16.dp))

                Text(
                    text = "Contacto: lazaroyunier96@outlook.es",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = onAccept,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Aceptar y Registrarse")
                    }
                }
            }
        }
    }
}

@Composable
private fun TermSection(
    title: String,
    items: List<String>,
    emphasis: String? = null,
    note: String? = null,
    isWarning: Boolean = false
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        if (isWarning) {
            Surface(
                color = MaterialTheme.colorScheme.errorContainer,
                shape = MaterialTheme.shapes.small,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(8.dp),
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        } else {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        items.forEach { item ->
            Text(
                text = item,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(start = 8.dp, top = 2.dp)
            )
        }

        if (emphasis != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = emphasis,
                style = MaterialTheme.typography.bodyMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.error
            )
        }

        if (note != null) {
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = note,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}
