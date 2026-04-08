package cu.lazaroysr96.sysgdcont.data.repository

import cu.lazaroysr96.sysgdcont.data.api.ApiService
import cu.lazaroysr96.sysgdcont.data.model.CreateManualPaymentOrderRequest
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentCatalogResponse
import cu.lazaroysr96.sysgdcont.data.model.ManualPaymentOrder
import org.json.JSONObject
import retrofit2.Response
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ManualPaymentRepository @Inject constructor(
    private val apiService: ApiService,
    private val authRepository: AuthRepository
) {
    suspend fun getCatalog(): Result<ManualPaymentCatalogResponse> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.getManualPaymentCatalog("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!)
            } else {
                handleAuthFailureIfNeeded(response)
                Result.failure(Exception(extractApiError(response, "No se pudo cargar el catálogo de planes")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getOrders(): Result<List<ManualPaymentOrder>> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.getManualPaymentOrders("Bearer $token")
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.orders)
            } else {
                handleAuthFailureIfNeeded(response)
                Result.failure(Exception(extractApiError(response, "No se pudieron cargar tus compras")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createOrder(request: CreateManualPaymentOrderRequest): Result<ManualPaymentOrder> {
        return try {
            val token = authRepository.getToken() ?: return Result.failure(Exception("No autenticado"))
            val response = apiService.createManualPaymentOrder("Bearer $token", request)
            if (response.isSuccessful && response.body() != null) {
                Result.success(response.body()!!.order)
            } else {
                handleAuthFailureIfNeeded(response)
                Result.failure(Exception(extractApiError(response, "No se pudo registrar la compra")))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private suspend fun handleAuthFailureIfNeeded(response: Response<*>) {
        if (response.code() == 401 || response.code() == 403) {
            authRepository.logout()
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
                if (errorBody.length < 120) errorBody else "$fallback (${response.code()})"
            }
        }
        return "$fallback (${response.code()})"
    }
}
