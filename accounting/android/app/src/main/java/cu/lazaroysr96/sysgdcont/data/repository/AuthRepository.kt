package cu.lazaroysr96.sysgdcont.data.repository

import android.content.Context
import android.net.Uri
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.AuthUser
import cu.lazaroysr96.sysgdcont.data.model.DeleteAccountRequest
import cu.lazaroysr96.sysgdcont.data.model.LoginRequest
import cu.lazaroysr96.sysgdcont.data.model.PasswordResetRequest
import cu.lazaroysr96.sysgdcont.data.model.RegisterRequest
import cu.lazaroysr96.sysgdcont.data.model.ResendTwoFactorRequest
import cu.lazaroysr96.sysgdcont.data.model.TwoFactorStatusResponse
import cu.lazaroysr96.sysgdcont.data.model.UpdateTwoFactorRequest
import cu.lazaroysr96.sysgdcont.data.model.VerifyTwoFactorRequest
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.security.MessageDigest
import android.util.Base64
import javax.crypto.Cipher
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.SecretKeySpec

private val Context.authDataStore: DataStore<Preferences> by preferencesDataStore(name = "auth_prefs")

sealed class LoginFlowResult {
    data class Success(val user: AuthUser) : LoginFlowResult()
    data class RequiresTwoFactor(val twoFactorToken: String, val message: String?) : LoginFlowResult()
}

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
        private val FIRST_LOGIN_KEY = stringPreferencesKey("first_login_sync")
    }

    private val gson = Gson()

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

    suspend fun shouldAutoSyncOnFirstLogin(): Boolean {
        val firstLogin = context.authDataStore.data.first()[FIRST_LOGIN_KEY]
        return firstLogin == null || firstLogin == "true"
    }

    suspend fun markFirstLoginSyncComplete() {
        context.authDataStore.edit { prefs ->
            prefs[FIRST_LOGIN_KEY] = "false"
        }
    }

    suspend fun wakeUpServer(maxRetries: Int = 5, delayMs: Long = 10000): Result<Unit> {
        for (attempt in 0 until maxRetries) {
            val isSuccess = try {
                val response = apiService.checkServerStatus()
                response.isSuccessful
            } catch (e: Exception) {
                false
            }
            if (isSuccess) {
                return Result.success(Unit)
            }
            if (attempt < maxRetries - 1) {
                kotlinx.coroutines.delay(delayMs)
            }
        }
        return Result.failure(Exception("Servidor no disponible después de $maxRetries intentos"))
    }

    suspend fun getAvailableCredits(): Result<Int> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.getUserPlan("Bearer $token")
            if (response.isSuccessful) {
                val available = response.body()?.credits?.available ?: 0
                Result.success(available)
            } else {
                if (response.code() == 401 || response.code() == 403) {
                    logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
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

    suspend fun loginWithFlow(email: String, password: String): Result<LoginFlowResult> {
        return try {
            val response = apiService.login(LoginRequest(email, password))
            if (!response.isSuccessful) {
                return Result.failure(Exception(extractApiError(response, "Error al iniciar sesión")))
            }

            val body = response.body() ?: return Result.failure(Exception("Respuesta de login vacía"))
            if (body.requiresTwoFactor == true && !body.twoFactorToken.isNullOrBlank()) {
                return Result.success(LoginFlowResult.RequiresTwoFactor(body.twoFactorToken, body.message))
            }

            val token = body.token
            val user = body.user
            if (token.isNullOrBlank() || user == null) {
                Result.failure(Exception("Respuesta de login inválida"))
            } else {
                saveSession(token, user)
                Result.success(LoginFlowResult.Success(user))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun verifyTwoFactor(twoFactorToken: String, code: String): Result<AuthUser> {
        return try {
            val response = apiService.verifyTwoFactor(VerifyTwoFactorRequest(twoFactorToken, code))
            if (!response.isSuccessful) {
                return Result.failure(Exception(extractApiError(response, "No se pudo verificar el código")))
            }

            val body = response.body() ?: return Result.failure(Exception("Respuesta vacía al verificar 2FA"))
            val token = body.token
            val user = body.user
            if (token.isNullOrBlank() || user == null) {
                Result.failure(Exception("Respuesta inválida al verificar 2FA"))
            } else {
                saveSession(token, user)
                Result.success(user)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resendTwoFactor(twoFactorToken: String): Result<String> {
        return try {
            val response = apiService.resendTwoFactor(ResendTwoFactorRequest(twoFactorToken))
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Código reenviado correctamente")
            } else {
                Result.failure(Exception(extractApiError(response, "No se pudo reenviar el código")))
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

    suspend fun getTwoFactorStatus(): Result<TwoFactorStatusResponse> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.getTwoFactorStatus("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                if (response.code() == 401 || response.code() == 403) {
                    logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                Result.failure(Exception(extractApiError(response, "No se pudo cargar estado de 2FA")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEmailVerificationStatus(): Result<Boolean> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.getVerificationStatus("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.verified)
            } else {
                if (response.code() == 401 || response.code() == 403) {
                    logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                Result.failure(Exception(extractApiError(response, "No se pudo cargar estado de verificación")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun resendVerificationEmail(): Result<String> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.resendVerification("Bearer $token")
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Correo de verificación enviado")
            } else {
                if (response.code() == 401 || response.code() == 403) {
                    logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                Result.failure(Exception(extractApiError(response, "No se pudo enviar el correo de verificación")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun updateTwoFactorStatus(enabled: Boolean, password: String): Result<String> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.updateTwoFactorStatus(
                "Bearer $token",
                UpdateTwoFactorRequest(enabled = enabled, password = password)
            )
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Configuración actualizada")
            } else {
                if (response.code() == 401 || response.code() == 403) {
                    logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                Result.failure(Exception(extractApiError(response, "No se pudo actualizar 2FA")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun deleteOwnAccount(password: String): Result<String> {
        return try {
            val token = getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.deleteOwnAccount(
                "Bearer $token",
                DeleteAccountRequest(password = password)
            )
            if (response.isSuccessful) {
                logout()
                Result.success(response.body()?.message ?: "Cuenta eliminada")
            } else {
                if (response.code() == 401 || response.code() == 403) {
                    logout()
                    return Result.failure(Exception("Tu sesión expiró. Inicia sesión de nuevo."))
                }
                Result.failure(Exception(extractApiError(response, "No se pudo eliminar la cuenta")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestPasswordReset(email: String): Result<String> {
        return try {
            val response = apiService.requestPasswordReset(PasswordResetRequest(email))
            if (response.isSuccessful) {
                Result.success(response.body()?.message ?: "Si el correo está verificado, recibirás un enlace.")
            } else {
                Result.failure(Exception(extractApiError(response, "No se pudo iniciar recuperación")))
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
                saveSession(token, user)
                Result.success(user)
            } else {
                Result.failure(Exception("Token inválido o expirado"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun setAccessKey(accessKey: String): Result<AuthUser> {
        return try {
            val auth = accessKey.split("\n")
            if (auth.size >= 5) {
                context.authDataStore.edit { prefs ->
                    prefs[TOKEN_KEY] = auth[0]
                    prefs[USER_ID_KEY] = auth[1]
                    prefs[USER_NAME_KEY] = auth[2]
                    prefs[USER_EMAIL_KEY] = auth[3]
                    prefs[USER_PRIVILEGES_KEY] = auth[4]
                }
                Result.success(AuthUser(
                    id = auth[1],
                    name = auth[2],
                    email = auth[3],
                    privileges = auth[4]
                ))
            } else {
                Result.failure(Exception("Token inválido o expirado"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    internal data class AccessKeyPayload(
        val app: String = "SYSGD Cont Android",
        val version: Int = 1,
        val token: String,
        val userId: String,
        val userName: String,
        val userEmail: String,
        val userPrivileges: String,
        val createdAt: String
    )

    suspend fun exportAccessKeyToUri(uri: Uri, userPassword: String): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val prefs = context.authDataStore.data.first()
            val token = prefs[TOKEN_KEY] ?: return@withContext Result.failure(Exception("No hay sesión activa"))
            val userId = prefs[USER_ID_KEY] ?: return@withContext Result.failure(Exception("No hay usuario"))
            val userName = prefs[USER_NAME_KEY] ?: ""
            val userEmail = prefs[USER_EMAIL_KEY] ?: ""
            val userPrivileges = prefs[USER_PRIVILEGES_KEY] ?: ""

            val payload = AccessKeyPayload(
                token = token,
                userId = userId,
                userName = userName,
                userEmail = userEmail,
                userPrivileges = userPrivileges,
                createdAt = java.time.Instant.now().toString()
            )

            val json = gson.toJson(payload)
            val encrypted = encryptData(json, userPassword)

            context.contentResolver.openOutputStream(uri)?.use { output ->
                output.write(encrypted.toByteArray(Charsets.UTF_8))
            } ?: throw Exception("No se pudo abrir el destino para guardar el archivo")

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun importAccessKeyFromUri(uri: Uri, userPassword: String): Result<AuthUser> = withContext(Dispatchers.IO) {
        try {
            val rawEncrypted = context.contentResolver.openInputStream(uri)?.bufferedReader(Charsets.UTF_8)?.use { it.readText() }
                ?: throw Exception("No se pudo leer el archivo seleccionado")

            val decrypted = decryptData(rawEncrypted, userPassword)
            val payload = gson.fromJson(decrypted, AccessKeyPayload::class.java)
                ?: throw Exception("El archivo no contiene una llave de acceso válida")

            context.authDataStore.edit { prefs ->
                prefs[TOKEN_KEY] = payload.token
                prefs[USER_ID_KEY] = payload.userId
                prefs[USER_NAME_KEY] = payload.userName
                prefs[USER_EMAIL_KEY] = payload.userEmail
                prefs[USER_PRIVILEGES_KEY] = payload.userPrivileges
            }

            Result.success(AuthUser(
                id = payload.userId,
                name = payload.userName,
                email = payload.userEmail,
                privileges = payload.userPrivileges
            ))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun encryptData(data: String, password: String): String {
        val salt = ByteArray(16)
        java.security.SecureRandom().nextBytes(salt)
        val key = deriveKey(password, salt)
        val iv = ByteArray(12)
        java.security.SecureRandom().nextBytes(iv)

        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.ENCRYPT_MODE, key, spec)
        val encrypted = cipher.doFinal(data.toByteArray(Charsets.UTF_8))

        val combined = ByteArray(salt.size + iv.size + encrypted.size)
        System.arraycopy(salt, 0, combined, 0, salt.size)
        System.arraycopy(iv, 0, combined, salt.size, iv.size)
        System.arraycopy(encrypted, 0, combined, salt.size + iv.size, encrypted.size)

        return Base64.encodeToString(combined, Base64.NO_WRAP)
    }

    private fun decryptData(encryptedData: String, password: String): String {
        val combined = Base64.decode(encryptedData, Base64.NO_WRAP)

        val salt = ByteArray(16)
        val iv = ByteArray(12)
        val encrypted = ByteArray(combined.size - 28)

        System.arraycopy(combined, 0, salt, 0, 16)
        System.arraycopy(combined, 16, iv, 0, 12)
        System.arraycopy(combined, 28, encrypted, 0, encrypted.size)

        val key = deriveKey(password, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val spec = GCMParameterSpec(128, iv)
        cipher.init(Cipher.DECRYPT_MODE, key, spec)

        return String(cipher.doFinal(encrypted), Charsets.UTF_8)
    }

    private fun deriveKey(password: String, salt: ByteArray): SecretKeySpec {
        val factory = MessageDigest.getInstance("SHA-256")
        factory.update(salt)
        val hash = factory.digest(password.toByteArray(Charsets.UTF_8))
        return SecretKeySpec(hash, "AES")
    }

    private fun extractApiError(response: Response<*>, fallback: String): String {
        val errorBody = response.errorBody()?.string()
        if (!errorBody.isNullOrBlank()) {
            return try {
                val json = JSONObject(errorBody)
                // Priorizar el mensaje detallado (message), luego el error genérico
                json.optString("message")
                    .ifBlank { json.optString("error") }
                    .ifBlank { 
                        // Si es 403, dar un contexto adicional
                        if (response.code() == 403) "Verifica tu conexión a internet e intenta nuevamente" 
                        else "$fallback (${response.code()})" 
                    }
            } catch (_: Exception) {
                // Si no es JSON, usar el texto tal cual
                if (errorBody.length < 100) errorBody
                else "$fallback (${response.code()})"
            }
        }
        return "$fallback (${response.code()})"
    }

    private suspend fun saveSession(token: String, user: AuthUser) {
        context.authDataStore.edit { prefs ->
            prefs[TOKEN_KEY] = token
            prefs[USER_ID_KEY] = user.id
            prefs[USER_NAME_KEY] = user.name
            prefs[USER_EMAIL_KEY] = user.email
            prefs[USER_PRIVILEGES_KEY] = user.privileges
        }
    }
}
