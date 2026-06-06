package cu.lazaroysr96.sysgdcont.core

import cu.lazaroysr96.sysgdcont.BuildConfig

object AppEdition {
    private const val BASE_ID = "cu.lazaroysr96.sysgdcont"
    
    val applicationId: String = BuildConfig.APPLICATION_ID
    
    val distribution: String = when {
        applicationId == BASE_ID                              -> "apklis"
        applicationId.endsWith(".freemium", ignoreCase = true) -> "freemium"
        applicationId.startsWith(BASE_ID, ignoreCase = true)  -> 
            applicationId.removePrefix("$BASE_ID.").lowercase()
        else -> "unknown"
    }

    val isFreemium: Boolean = distribution == "freemium"
    val isReseller: Boolean = distribution !in listOf("apklis", "freemium", "unknown")
    val resellerTag: String? = if (isReseller) distribution else null
    
    val resellerNumber = "52375492"
    val resellerTarjeta = "9212-9598-7255-8673"
    val resellerName = "Daniuska Posada"
}
