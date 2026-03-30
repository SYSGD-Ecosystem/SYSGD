import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type {
  AccountingCategory,
  AccountingItem,
  AccountingSubcategory,
  CnaeItem
} from '../../models/nomenclator.model';
import { NomenclatorService } from '../../services/nomenclator.service';

interface ResourceLink {
  title: string;
  url: string;
  description: string;
}

@Component({
  selector: 'app-resources-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './resources-section.component.html',
  styleUrl: './resources-section.component.css'
})
export class ResourcesSectionComponent implements OnInit {
  readonly resources: ResourceLink[] = [
    {
      title: 'ONAT - Legislación tributaria',
      url: 'https://www.onat.gob.cu/home/legislacion',
      description:
        'Consulta y descarga gacetas oficiales en PDF con normas vigentes para personas naturales y jurídicas, incluyendo resumen de cada legislación y su organismo emisor.'
    },
    {
      title: 'ONAT - Modelos y Formularios',
      url: 'https://www.onat.gob.cu/home/modelos-formularios?page=9',
      description:
        'Descarga modelos y formularios en PDF, Excel y Winrar para declarar, pagar tributos y registrar ingresos y gastos. Incluye herramientas en Excel y documentos instructivos.'
    },
    {
      title: 'Cubadebate - Herramientas y normativas contables TCP',
      url: 'http://www.cubadebate.cu/especiales/2025/03/09/herramientas-y-normativas-contables-para-trabajadores-por-cuenta-propia-que-debes-saber/',
      description:
        'Artículo de referencia con orientaciones prácticas y normativas contables útiles para trabajadores por cuenta propia.'
    }
  ];

  activeReferenceTab: 'accounting' | 'cnae' = 'accounting';
  accountingQuery = '';
  cnaeQuery = '';
  selectedCategoryCode = '';
  selectedSubcategoryCode = '';
  accountingCategories: AccountingCategory[] = [];
  accountingSubcategories: AccountingSubcategory[] = [];
  accountingResults: AccountingItem[] = [];
  cnaeResults: CnaeItem[] = [];
  isLoadingAccounting = false;
  isLoadingCnae = false;
  errorMessage = '';

  constructor(private readonly nomenclatorService: NomenclatorService) {}

  async ngOnInit(): Promise<void> {
    await this.loadFilters();
    await this.searchAccounting();
  }

  async loadFilters(): Promise<void> {
    try {
      const [categories, subcategories] = await Promise.all([
        this.nomenclatorService.getAccountingCategories(),
        this.nomenclatorService.getAccountingSubcategories()
      ]);
      this.accountingCategories = categories;
      this.accountingSubcategories = subcategories;
    } catch (error) {
      this.errorMessage = this.formatError(error, 'No se pudieron cargar los filtros del nomenclador.');
    }
  }

  async searchAccounting(): Promise<void> {
    this.isLoadingAccounting = true;
    this.errorMessage = '';

    try {
      this.accountingResults = await this.nomenclatorService.searchAccounting({
        query: this.accountingQuery,
        categoryCode: this.selectedCategoryCode,
        subcategoryCode: this.selectedSubcategoryCode,
        limit: 80
      });
    } catch (error) {
      this.errorMessage = this.formatError(error, 'No se pudo consultar el nomenclador contable.');
    } finally {
      this.isLoadingAccounting = false;
    }
  }

  async searchCnae(): Promise<void> {
    this.isLoadingCnae = true;
    this.errorMessage = '';

    try {
      this.cnaeResults = await this.nomenclatorService.searchCnae(this.cnaeQuery, 50);
    } catch (error) {
      this.errorMessage = this.formatError(error, 'No se pudo consultar el nomenclador CNAE.');
    } finally {
      this.isLoadingCnae = false;
    }
  }

  clearAccountingFilters(): void {
    this.accountingQuery = '';
    this.selectedCategoryCode = '';
    this.selectedSubcategoryCode = '';
    void this.searchAccounting();
  }

  private formatError(error: unknown, fallback: string): string {
    if (typeof error === 'object' && error && 'error' in error) {
      const maybeError = error as { error?: { error?: string } };
      if (maybeError.error?.error) {
        return maybeError.error.error;
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    return fallback;
  }
}
