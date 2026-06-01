package cu.lazaroysr96.sysgdcont.data.api

import cu.lazaroysr96.sysgdcont.data.model.*
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @GET("api/status")
    suspend fun checkServerStatus(): Response<Unit>

    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/auth/verify-2fa")
    suspend fun verifyTwoFactor(@Body request: VerifyTwoFactorRequest): Response<LoginResponse>

    @POST("api/auth/resend-2fa")
    suspend fun resendTwoFactor(@Body request: ResendTwoFactorRequest): Response<ApiMessageResponse>

    @POST("api/users/register")
    suspend fun register(@Body request: RegisterRequest): Response<Unit>

    @GET("api/auth/me")
    suspend fun me(@Header("Authorization") token: String): Response<AuthUser>

    @GET("api/auth/2fa/status")
    suspend fun getTwoFactorStatus(@Header("Authorization") token: String): Response<TwoFactorStatusResponse>

    @PUT("api/auth/2fa/status")
    suspend fun updateTwoFactorStatus(
        @Header("Authorization") token: String,
        @Body request: UpdateTwoFactorRequest
    ): Response<ApiMessageResponse>

    @PUT("api/auth/password")
    suspend fun changePassword(
        @Header("Authorization") token: String,
        @Body request: ChangePasswordRequest
    ): Response<ApiMessageResponse>

    @HTTP(method = "DELETE", path = "api/auth/account", hasBody = true)
    suspend fun deleteOwnAccount(
        @Header("Authorization") token: String,
        @Body request: DeleteAccountRequest
    ): Response<ApiMessageResponse>

    @GET("api/verification/status")
    suspend fun getVerificationStatus(@Header("Authorization") token: String): Response<VerificationStatusResponse>

    @POST("api/verification/resend-verification")
    suspend fun resendVerification(@Header("Authorization") token: String): Response<ApiMessageResponse>

    @POST("api/verification/request-password-reset")
    suspend fun requestPasswordReset(@Body request: PasswordResetRequest): Response<ApiMessageResponse>

    @GET("api/users/plan")
    suspend fun getUserPlan(@Header("Authorization") token: String): Response<UserPlanResponse>

    @GET("api/manual-payments/products")
    suspend fun getManualPaymentCatalog(@Header("Authorization") token: String): Response<ManualPaymentCatalogResponse>

    @GET("api/manual-payments/orders")
    suspend fun getManualPaymentOrders(@Header("Authorization") token: String): Response<ManualPaymentOrdersResponse>

    @POST("api/manual-payments/orders")
    suspend fun createManualPaymentOrder(
        @Header("Authorization") token: String,
        @Body request: CreateManualPaymentOrderRequest
    ): Response<ManualPaymentOrderResponse>

    @GET("api/cont-ledger")
    suspend fun getLedger(@Header("Authorization") token: String): Response<ContLedgerResponse>

    @PUT("api/cont-ledger")
    suspend fun updateLedger(
        @Header("Authorization") token: String,
        @Body request: UpdateLedgerRequest
    ): Response<UpdateLedgerResponse>

    @POST("api/accounting-documents/pdf/tcp")
    @Streaming
    suspend fun downloadPdf(
        @Header("Authorization") token: String,
        @Body payload: TcpPdfPayload
    ): Response<ResponseBody>
}
