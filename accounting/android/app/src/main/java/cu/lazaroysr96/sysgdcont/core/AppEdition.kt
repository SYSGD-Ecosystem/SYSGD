package cu.lazaroysr96.sysgdcont.core

import cu.lazaroysr96.sysgdcont.BuildConfig

object AppEdition {
    private const val FREEMIUM_SUFFIX = ".freemium"

    val applicationId: String = BuildConfig.APPLICATION_ID
    val distribution: String =
        if (applicationId.endsWith(FREEMIUM_SUFFIX, ignoreCase = true)) "freemium" else "apklis"

    val isFreemium: Boolean = distribution == "freemium"
}
