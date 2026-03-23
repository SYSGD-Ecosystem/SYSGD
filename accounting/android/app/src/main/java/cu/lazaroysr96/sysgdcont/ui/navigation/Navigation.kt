package cu.lazaroysr96.sysgdcont.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Login : Screen("login", "Login", Icons.Default.Login)
    object Main : Screen("main", "Main", Icons.Default.Home)
}

sealed class MainTab(val route: String, val title: String, val icon: ImageVector) {
    object Generales : MainTab("generales", "General", Icons.Default.Person)
    object Ingresos : MainTab("ingresos", "Ingresos", Icons.Default.TrendingUp)
    object Gastos : MainTab("gastos", "Gastos", Icons.Default.TrendingDown)
    object Tributos : MainTab("tributos", "Tributos", Icons.Default.AccountBalance)
    object Resumen : MainTab("resumen", "Resumen", Icons.Default.Summarize)
}

val mainTabs = listOf(
    MainTab.Generales,
    MainTab.Ingresos,
    MainTab.Gastos,
    MainTab.Tributos,
    MainTab.Resumen
)
