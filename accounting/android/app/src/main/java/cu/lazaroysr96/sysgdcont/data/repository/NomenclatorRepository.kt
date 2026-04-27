package cu.lazaroysr96.sysgdcont.data.repository

import cu.lazaroysr96.sysgdcont.data.NomenclatorDatabaseHelper
import cu.lazaroysr96.sysgdcont.data.model.AccountingCategory
import cu.lazaroysr96.sysgdcont.data.model.AccountingItem
import cu.lazaroysr96.sysgdcont.data.model.AccountingSubaccount
import cu.lazaroysr96.sysgdcont.data.model.AccountingSubcategory
import cu.lazaroysr96.sysgdcont.data.model.CnaeCorrelation
import cu.lazaroysr96.sysgdcont.data.model.CnaeItem
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NomenclatorRepository @Inject constructor(
    private val dbHelper: NomenclatorDatabaseHelper
) {
    fun searchCnae(term: String): List<CnaeItem> {
        val db = dbHelper.openDatabase()
        return try {
            val value = "%${term.trim()}%"
            db.rawQuery(
                """
                SELECT section, extructure, code, description
                FROM cnae
                WHERE ? = '%%'
                   OR UPPER(description) LIKE UPPER(?)
                   OR UPPER(code) LIKE UPPER(?)
                   OR UPPER(section) LIKE UPPER(?)
                   OR UPPER(extructure) LIKE UPPER(?)
                ORDER BY code
                """.trimIndent(),
                arrayOf(value, value, value, value, value)
            ).use { cursor ->
                buildList {
                    while (cursor.moveToNext()) {
                        val code = cursor.getString(2)
                        add(
                            CnaeItem(
                                section = cursor.getString(0),
                                structure = cursor.getString(1),
                                code = code,
                                description = cursor.getString(3),
                                notes = getCnaeNotes(db, code),
                                correlations = getCnaeCorrelations(db, code)
                            )
                        )
                    }
                }
            }
        } finally {
            db.close()
        }
    }

    fun getAccountingCategories(): List<AccountingCategory> {
        val db = dbHelper.openDatabase()
        return try {
            db.rawQuery(
                "SELECT code, name FROM account_categories ORDER BY sort_order",
                null
            ).use { cursor ->
                buildList {
                    while (cursor.moveToNext()) {
                        add(AccountingCategory(cursor.getString(0), cursor.getString(1)))
                    }
                }
            }
        } finally {
            db.close()
        }
    }

    fun getAccountingSubcategories(): List<AccountingSubcategory> {
        val db = dbHelper.openDatabase()
        return try {
            db.rawQuery(
                "SELECT code, name FROM account_subcategories ORDER BY sort_order",
                null
            ).use { cursor ->
                buildList {
                    while (cursor.moveToNext()) {
                        add(AccountingSubcategory(cursor.getString(0), cursor.getString(1)))
                    }
                }
            }
        } finally {
            db.close()
        }
    }

    fun searchAccounting(
        term: String,
        categoryCode: String?,
        subcategoryCode: String?
    ): List<AccountingItem> {
        val db = dbHelper.openDatabase()
        return try {
            val args = mutableListOf<String>()
            val where = mutableListOf<String>()

            if (!categoryCode.isNullOrBlank()) {
                where += "category_code = ?"
                args += categoryCode
            }

            if (!subcategoryCode.isNullOrBlank()) {
                where += "subcategory_code = ?"
                args += subcategoryCode
            }

            val sql = buildString {
                append(
                    """
                    SELECT
                        category_code,
                        category_name,
                        COALESCE(subcategory_code, ''),
                        COALESCE(subcategory_name, ''),
                        account_code,
                        account_name,
                        account_nature,
                        COALESCE(account_description, ''),
                        COALESCE(subaccount_code, ''),
                        COALESCE(subaccount_name, ''),
                        COALESCE(subaccount_nature, '')
                    FROM account_catalog_flat
                    """.trimIndent()
                )
                if (where.isNotEmpty()) {
                    append(" WHERE ")
                    append(where.joinToString(" AND "))
                }
                append(" ORDER BY category_code, subcategory_code, account_code, subaccount_code")
            }

            db.rawQuery(sql, args.toTypedArray()).use { cursor ->
                val grouped = linkedMapOf<String, MutableAccountingItem>()
                while (cursor.moveToNext()) {
                    val category = cursor.getString(0)
                    val subcategory = cursor.getString(2)
                    val accountCode = cursor.getString(4)
                    val key = listOf(category, subcategory, accountCode).joinToString("|")
                    val item = grouped.getOrPut(key) {
                        MutableAccountingItem(
                            categoryCode = category,
                            categoryName = cursor.getString(1),
                            subcategoryCode = subcategory,
                            subcategoryName = cursor.getString(3),
                            accountCode = accountCode,
                            accountName = cursor.getString(5),
                            accountNature = cursor.getString(6),
                            accountDescription = cursor.getString(7)
                        )
                    }

                    val subaccountCode = cursor.getString(8)
                    if (!subaccountCode.isNullOrBlank()) {
                        item.subaccounts += AccountingSubaccount(
                            code = subaccountCode,
                            name = cursor.getString(9),
                            nature = cursor.getString(10)
                        )
                    }
                }

                grouped.values
                    .map { item ->
                        AccountingItem(
                            categoryCode = item.categoryCode,
                            categoryName = item.categoryName,
                            subcategoryCode = item.subcategoryCode,
                            subcategoryName = item.subcategoryName,
                            accountCode = item.accountCode,
                            accountName = item.accountName,
                            accountNature = item.accountNature,
                            accountDescription = item.accountDescription,
                            subaccounts = item.subaccounts
                        )
                    }
                    .filter { item ->
                        matchesAccountingTerm(item, term)
                    }
            }
        } finally {
            db.close()
        }
    }

    private fun matchesAccountingTerm(item: AccountingItem, term: String): Boolean {
        val normalizedTerm = term.trim()
        if (normalizedTerm.isBlank()) return true

        val haystack = buildList {
            add(item.accountCode)
            add(item.accountName)
            add(item.accountNature)
            add(item.accountDescription)
            add(item.categoryCode)
            add(item.categoryName)
            add(item.subcategoryCode)
            add(item.subcategoryName)
            item.subaccounts.forEach { subaccount ->
                add(subaccount.code)
                add(subaccount.name)
                add(subaccount.nature)
            }
        }.joinToString("\n").uppercase()

        return haystack.contains(normalizedTerm.uppercase())
    }

    private data class MutableAccountingItem(
        val categoryCode: String,
        val categoryName: String,
        val subcategoryCode: String,
        val subcategoryName: String,
        val accountCode: String,
        val accountName: String,
        val accountNature: String,
        val accountDescription: String,
        val subaccounts: MutableList<AccountingSubaccount> = mutableListOf()
    )

    private fun getCnaeNotes(db: android.database.sqlite.SQLiteDatabase, code: String): List<String> {
        return db.rawQuery(
            "SELECT descripcion FROM cnae_notes WHERE codigo_notas = ?",
            arrayOf(code)
        ).use { cursor ->
            buildList {
                while (cursor.moveToNext()) {
                    add(cursor.getString(0))
                }
            }
        }
    }

    private fun getCnaeCorrelations(
        db: android.database.sqlite.SQLiteDatabase,
        code: String
    ): List<CnaeCorrelation> {
        return db.rawQuery(
            """
            SELECT code_cnae, description_cnae, code_nae, description_nae, code_ciiu, description_ciiu
            FROM cnae_correlation
            WHERE code_cnae = ?
            """.trimIndent(),
            arrayOf(code)
        ).use { cursor ->
            buildList {
                while (cursor.moveToNext()) {
                    add(
                        CnaeCorrelation(
                            codeCnae = cursor.getString(0),
                            descriptionCnae = cursor.getString(1),
                            codeNae = cursor.getString(2),
                            descriptionNae = cursor.getString(3),
                            codeCiiu = cursor.getString(4),
                            descriptionCiiu = cursor.getString(5)
                        )
                    )
                }
            }
        }
    }
}
