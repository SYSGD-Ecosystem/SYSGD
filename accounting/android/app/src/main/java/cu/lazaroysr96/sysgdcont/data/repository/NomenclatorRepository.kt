package cu.lazaroysr96.sysgdcont.data.repository

import cu.lazaroysr96.sysgdcont.data.NomenclatorDatabaseHelper
import cu.lazaroysr96.sysgdcont.data.model.AccountingCategory
import cu.lazaroysr96.sysgdcont.data.model.AccountingItem
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
            val value = "%${term.trim()}%"

            if (term.isNotBlank()) {
                where += """
                    (
                        UPPER(display_name) LIKE UPPER(?)
                        OR UPPER(display_code) LIKE UPPER(?)
                        OR UPPER(category_name) LIKE UPPER(?)
                        OR UPPER(subcategory_name) LIKE UPPER(?)
                    )
                """.trimIndent()
                repeat(4) { args += value }
            }

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
                        item_type,
                        category_code,
                        category_name,
                        COALESCE(subcategory_code, ''),
                        COALESCE(subcategory_name, ''),
                        account_code,
                        account_name,
                        account_nature,
                        COALESCE(subaccount_code, ''),
                        COALESCE(subaccount_name, ''),
                        COALESCE(subaccount_nature, ''),
                        display_code,
                        display_name,
                        display_nature
                    FROM (
                        SELECT
                            'Cuenta' AS item_type,
                            category_code,
                            category_name,
                            subcategory_code,
                            subcategory_name,
                            account_code,
                            account_name,
                            account_nature,
                            NULL AS subaccount_code,
                            NULL AS subaccount_name,
                            NULL AS subaccount_nature,
                            account_code AS display_code,
                            account_name AS display_name,
                            account_nature AS display_nature
                        FROM account_catalog_flat
                        WHERE subaccount_id IS NULL
                        UNION ALL
                        SELECT
                            'Subcuenta' AS item_type,
                            category_code,
                            category_name,
                            subcategory_code,
                            subcategory_name,
                            account_code,
                            account_name,
                            account_nature,
                            subaccount_code,
                            subaccount_name,
                            subaccount_nature,
                            account_code || '.' || subaccount_code AS display_code,
                            subaccount_name AS display_name,
                            subaccount_nature AS display_nature
                        FROM account_catalog_flat
                        WHERE subaccount_id IS NOT NULL
                    ) catalog
                    """.trimIndent()
                )
                if (where.isNotEmpty()) {
                    append(" WHERE ")
                    append(where.joinToString(" AND "))
                }
                append(" ORDER BY category_code, subcategory_code, account_code, subaccount_code")
            }

            db.rawQuery(sql, args.toTypedArray()).use { cursor ->
                buildList {
                    while (cursor.moveToNext()) {
                        add(
                            AccountingItem(
                                itemType = cursor.getString(0),
                                categoryCode = cursor.getString(1),
                                categoryName = cursor.getString(2),
                                subcategoryCode = cursor.getString(3),
                                subcategoryName = cursor.getString(4),
                                accountCode = cursor.getString(5),
                                accountName = cursor.getString(6),
                                accountNature = cursor.getString(7),
                                subaccountCode = cursor.getString(8),
                                subaccountName = cursor.getString(9),
                                subaccountNature = cursor.getString(10),
                                displayCode = cursor.getString(11),
                                displayName = cursor.getString(12),
                                displayNature = cursor.getString(13)
                            )
                        )
                    }
                }
            }
        } finally {
            db.close()
        }
    }

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
