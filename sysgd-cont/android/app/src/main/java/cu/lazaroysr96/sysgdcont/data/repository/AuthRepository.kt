package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.AuthUser
import cu.lazaroysr96.sysgdcont.data.model.LoginRequest
import cu.lazaroysr96.sysgdcont.data.model.RegisterRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

@Singleton
class AuthRepository @Inject constructor(
    @ApplicationContext private val context: Context,
    private val apiService: ApiService
) {
    companion object {
        private val TOKEN_KEY = stringPreferencesKey("auth_token")
        private val API_BASE_KEY = stringPreferencesKey("api_base_url")
        private val USER_ID_KEY = stringPreferencesKey("user_id")
        private val USER_NAME_KEY = stringPreferencesKey("user_name")
        private val USER_EMAIL_KEY = stringPreferencesKey("user_email")
        private val USER_PRIVILEGES_KEY = stringPreferencesKey("user_privileges")
    }

    val isAuthenticated: Flow<Boolean> = context.authDataStore.data.map { prefs ->
        prefs[TOKEN_KEY] != null
    }

    val currentUser: Flow<AuthUser?> = context.authDataStore.data.map { prefs ->
        val id = prefs[USER_ID_KEY]
        if (id != null) {
            AuthUser(
                id = id,
                name = prefs[USER_NAME_KEY] ?: "",
                email = prefs[USER_EMAIL_KEY] ?: "",
                privileges = prefs[USER_PRIVILEGES_KEY] ?: ""
            )
        } else null
    }

    suspend fun getToken(): String? = context.authDataStore.data.first()[TOKEN_KEY]

    suspend fun getAvailableCredits(): Result<Int> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.getUserPlan("Bearer $token")
            if (response.isSuccessful) {
                val available = response.body()?.credits?.available ?: 0
                Result.success(available)
            } else {
                Result.failure(Exception(extractApiError(response, "No se pudieron obtener los créditos")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    fun getApiBaseUrl(): String {
        return "https://sysgd-production.up.railway.app"
    }

    suspend fun setApiBaseUrl(url: String) {
        context.authDataStore.edit { prefs ->
            prefs[API_BASE_KEY] = url
        }
    }

    suspend fun login(email: String, password: String): Result<AuthUser> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (response.isSuccessful) {
                val body = response.body()!!
                context.authDataStore.edit { prefs ->
                    prefs[TOKEN_KEY] = body.token
                    prefs[USER_ID_KEY] = body.user.id
                    prefs[USER_NAME_KEY] = body.user.name
                    prefs[USER_EMAIL_KEY] = body.user.email
                    prefs[USER_PRIVILEGES_KEY] = body.user.privileges
                }
                Result.success(body.user)
            } else {
                Result.failure(Exception(extractApiError(response, "Error al iniciar sesión")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun register(name: String, email: String, password: String): Result<Unit> {
        return try {
            val response = apiService.register(RegisterRequest(name, email, password))
            if (response.isSuccessful) {
                Result.success(Unit)
            } else {
                Result.failure(Exception(extractApiError(response, "No se pudo crear la cuenta")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun logout() {
        context.authDataStore.edit { prefs ->
            prefs.remove(TOKEN_KEY)
            prefs.remove(USER_ID_KEY)
            prefs.remove(USER_NAME_KEY)
            prefs.remove(USER_EMAIL_KEY)
            prefs.remove(USER_PRIVILEGES_KEY)
        }
    }

    suspend fun setManualToken(token: String): Result<AuthUser> {
        return try {
            val response = apiService.me("Bearer $token")
            if (response.isSuccessful) {
                val user = response.body()!!
                context.authDataStore.edit { prefs ->
                    prefs[TOKEN_KEY] = token
                    prefs[USER_ID_KEY] = user.id
                    prefs[USER_NAME_KEY] = user.name
                    prefs[USER_EMAIL_KEY] = user.email
                    prefs[USER_PRIVILEGES_KEY] = user.privileges
                }
                Result.success(user)
            } else {
                Result.failure(Exception("Token inválido o expirado"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun extractApiError(response: Response<*>, fallback: String): String {
        val errorBody = response.errorBody()?.string()
        if (!errorBody.isNullOrBlank()) {
            return try {
                val json = JSONObject(errorBody)
                json.optString("message")
                    .ifBlank { json.optString("error") }
                    .ifBlank { "$fallback (${response.code()})" }
            } catch (_: Exception) {
                "$fallback (${response.code()})"
            }
        }
        return "$fallback (${response.code()})"
    }
}
