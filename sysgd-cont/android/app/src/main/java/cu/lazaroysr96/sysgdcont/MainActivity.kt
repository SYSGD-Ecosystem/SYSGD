package cu.lazaroysr96.sysgdcont

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.core.splashscreen.SplashScreen.Companion.installSplashScreen
import cu.lazaroysr96.sysgdcont.ui.auth.LoginScreen
import cu.lazaroysr96.sysgdcont.ui.main.MainScreen
import cu.lazaroysr96.sysgdcont.ui.theme.SysGDContTheme
import cu.lazaroysr96.sysgdcont.viewmodel.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint
import java.util.concurrent.atomic.AtomicBoolean

@AndroidEntryPoint
class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        val keepSplashVisible = AtomicBoolean(true)
        installSplashScreen().setKeepOnScreenCondition { keepSplashVisible.get() }
        super.onCreate(savedInstanceState)
        actionBar?.hide()
        setContent {
            SysGDContTheme {
                val navController = rememberNavController()
                val authViewModel: AuthViewModel = hiltViewModel()
                val authState by authViewModel.uiState.collectAsStateWithLifecycle()

                LaunchedEffect(authState.isSessionResolved) {
                    if (authState.isSessionResolved) {
                        keepSplashVisible.set(false)
                    }
                }

                if (!authState.isSessionResolved) {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                } else {
                    NavHost(
                        navController = navController,
                        startDestination = if (authState.isAuthenticated) "main" else "login"
                    ) {
                        composable("login") {
                            LoginScreen(
                                onLoginSuccess = {
                                    navController.navigate("main") {
                                        popUpTo("login") { inclusive = true }
                                    }
                                }
                            )
                        }
                        composable("main") {
                            MainScreen(
                                onLogout = {
                                    navController.navigate("login") {
                                        popUpTo("main") { inclusive = true }
                                    }
                                }
                            )
                        }
                    }
                }
            }
        }
    }
}
