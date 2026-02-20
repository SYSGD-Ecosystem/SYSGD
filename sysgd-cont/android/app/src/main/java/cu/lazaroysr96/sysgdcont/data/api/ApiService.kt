package cu.lazaroysr96.sysgdcont.data.api

import cu.lazaroysr96.sysgdcont.data.model.*
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {
    @POST("api/auth/login")
    suspend fun login(@Body request: LoginRequest): Response<LoginResponse>

    @POST("api/users/register")
    suspend fun register(@Body request: RegisterRequest): Response<Unit>

    @GET("api/auth/me")
    suspend fun me(@Header("Authorization") token: String): Response<AuthUser>

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
