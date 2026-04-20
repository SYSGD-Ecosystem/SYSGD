package cu.lazaroysr96.sysgdcont.data.model

enum class NomenclatorType {
    CNAE,
    ACCOUNTING
}

data class CnaeItem(
    val section: String,
    val structure: String,
    val code: String,
    val description: String,
    val notes: List<String> = emptyList(),
    val correlations: List<CnaeCorrelation> = emptyList()
)

data class CnaeCorrelation(
    val codeCnae: String,
    val descriptionCnae: String,
    val codeNae: String,
    val descriptionNae: String,
    val codeCiiu: String,
    val descriptionCiiu: String
)

data class AccountingCategory(
    val code: String,
    val name: String
)

data class AccountingSubcategory(
    val code: String,
    val name: String
)

data class AccountingSubaccount(
    val code: String,
    val name: String,
    val nature: String
)

data class AccountingItem(
    val categoryCode: String,
    val categoryName: String,
    val subcategoryCode: String,
    val subcategoryName: String,
    val accountCode: String,
    val accountName: String,
    val accountNature: String,
    val accountDescription: String,
    val subaccounts: List<AccountingSubaccount> = emptyList()
)
