package cu.lazaroysr96.sysgdcont.data.model

data class AuthUser(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val privileges: String = ""
)

data class LoginRequest(
    val email: String,
    val password: String
)

data class RegisterRequest(
    val name: String,
    val email: String,
    val password: String
)

data class LoginResponse(
    val token: String? = null,
    val user: AuthUser? = null,
    val requiresTwoFactor: Boolean? = null,
    val twoFactorToken: String? = null,
    val message: String? = null
)

data class VerifyTwoFactorRequest(
    val twoFactorToken: String,
    val code: String
)

data class ResendTwoFactorRequest(
    val twoFactorToken: String
)

data class TwoFactorStatusResponse(
    val enabled: Boolean = false,
    val mandatory: Boolean = false,
    val method: String = "email",
    val emailVerified: Boolean = false
)

data class UpdateTwoFactorRequest(
    val enabled: Boolean,
    val password: String
)

data class VerificationStatusResponse(
    val verified: Boolean = false,
    val verifiedAt: String? = null
)

data class PasswordResetRequest(
    val email: String
)

data class DeleteAccountRequest(
    val password: String
)

data class ApiMessageResponse(
    val message: String? = null,
    val error: String? = null
)

data class ContLedgerResponse(
    val registro: RegistroTCP?,
    val inventarioRegistro: InventarioRegistro? = null,
    val updatedAt: String?
)

data class UpdateLedgerRequest(
    val registro: RegistroTCP,
    val inventarioRegistro: InventarioRegistro? = null
)

data class UpdateLedgerResponse(
    val message: String? = null,
    val updatedAt: String? = null
)

data class UserPlanCredits(
    val available: Int = 0
)

data class UserPlanResponse(
    val credits: UserPlanCredits = UserPlanCredits()
)
