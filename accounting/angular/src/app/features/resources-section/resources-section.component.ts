import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

interface ResourceLink {
  title: string;
  url: string;
  description: string;
}

@Component({
  selector: 'app-resources-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './resources-section.component.html',
  styleUrl: './resources-section.component.css'
})
export class ResourcesSectionComponent {
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
}
