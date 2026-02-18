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
    val token: String,
    val user: AuthUser
)

data class ContLedgerResponse(
    val registro: RegistroTCP?,
    val updatedAt: String?
)
